const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const JSZip = require('jszip');
const xml2js = require('xml2js');
const PptxGenJS = require('pptxgenjs');

const app = express();
app.use(cors());
app.use(express.json());

// 데이터 디렉토리 구조 생성
const DATA_DIR = path.join(__dirname, 'data');
const PRESENTATIONS_DIR = path.join(DATA_DIR, 'presentations');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const TEMP_DIR = path.join(DATA_DIR, 'temp');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

// 필요한 디렉토리 생성
[DATA_DIR, PRESENTATIONS_DIR, IMAGES_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 인덱스 파일 로드
function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

// 인덱스 파일 저장
function saveIndex(index) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
}

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `upload_${uniqueSuffix}_${file.originalname}`);
  }
});

const upload = multer({ storage });

// 프레젠테이션 목록 조회
app.get('/presentations', (req, res) => {
  try {
    const index = loadIndex();
    res.json(index);
  } catch (error) {
    console.error('프레젠테이션 목록 조회 실패:', error);
    res.status(500).json({ error: '프레젠테이션 목록을 불러오는데 실패했습니다.' });
  }
});

// 특정 프레젠테이션 조회
app.get('/presentations/:id', (req, res) => {
  try {
    const presentationFile = path.join(PRESENTATIONS_DIR, `${req.params.id}.json`);
    if (!fs.existsSync(presentationFile)) {
      return res.status(404).json({ error: '프레젠테이션을 찾을 수 없습니다.' });
    }
    const presentation = JSON.parse(fs.readFileSync(presentationFile, 'utf8'));
    res.json(presentation);
  } catch (error) {
    console.error('프레젠테이션 조회 실패:', error);
    res.status(500).json({ error: '프레젠테이션을 불러오는데 실패했습니다.' });
  }
});

// 프레젠테이션 삭제
app.delete('/presentations/:id', (req, res) => {
  try {
    const presentationId = req.params.id;
    const presentationFile = path.join(PRESENTATIONS_DIR, `${presentationId}.json`);

    if (!fs.existsSync(presentationFile)) {
      return res.status(404).json({ error: '프레젠테이션을 찾을 수 없습니다.' });
    }

    const presentation = JSON.parse(fs.readFileSync(presentationFile, 'utf8'));

    presentation.slides.forEach(slide => {
      if (slide.images) {
        slide.images.forEach(imagePath => {
          const imageName = path.basename(imagePath);
          const imageFile = path.join(IMAGES_DIR, imageName);
          if (fs.existsSync(imageFile)) {
            fs.unlinkSync(imageFile);
          }
        });
      }
    });

    fs.unlinkSync(presentationFile);

    const index = loadIndex();
    const updatedIndex = index.filter(item => item._id !== presentationId);
    saveIndex(updatedIndex);

    res.json({ message: '프레젠테이션이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('프레젠테이션 삭제 실패:', error);
    res.status(500).json({ error: '프레젠테이션 삭제 중 오류가 발생했습니다.' });
  }
});

// PPT 파일 파싱 및 이미지 추출
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const pptxPath = req.file.path;
    const pptxBuffer = fs.readFileSync(pptxPath);
    const zip = new JSZip();
    const pptx = await zip.loadAsync(pptxBuffer);

    const presentationId = Date.now().toString();
    const slides = [];
    const slideFiles = Object.keys(pptx.files)
      .filter(file => file.startsWith('ppt/slides/slide'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)/)[1]);
        const bNum = parseInt(b.match(/slide(\d+)/)[1]);
        return aNum - bNum;
      });

    const allImageFiles = Object.keys(pptx.files)
      .filter(file => 
        file.startsWith('ppt/media/') && 
        (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
      );

    const slideImages = {};
    for (let i = 0; i < slideFiles.length; i++) {
      const slideNumber = i + 1;
      if (allImageFiles[i]) {
        const imageFile = allImageFiles[i];
        try {
          const imageBuffer = await pptx.file(imageFile).async('nodebuffer');
          const imageName = `${presentationId}_slide_${slideNumber}_${path.basename(imageFile)}`;
          const imagePathInServer = path.join(IMAGES_DIR, imageName);
          
          await fs.promises.writeFile(imagePathInServer, imageBuffer);
          slideImages[slideNumber] = [`/images/${imageName}`];
        } catch (error) {
          console.error(`이미지 저장 실패 (슬라이드 ${slideNumber}):`, error);
          slideImages[slideNumber] = [];
        }
      } else {
        slideImages[slideNumber] = [];
      }
    }

    for (const slideFile of slideFiles) {
      const slideContent = await pptx.file(slideFile).async('string');
      const slideXml = await xml2js.parseStringPromise(slideContent);
      let content = '';

      if (slideXml['p:sld'] && slideXml['p:sld']['p:cSld']) {
        const shapes = slideXml['p:sld']['p:cSld'][0]['p:spTree'][0]['p:sp'];
        if (shapes) {
          for (const shape of shapes) {
            if (shape['p:txBody']) {
              const paragraphs = shape['p:txBody'][0]['a:p'];
              if (paragraphs) {
                for (const paragraph of paragraphs) {
                  if (paragraph['a:r']) {
                    for (const run of paragraph['a:r']) {
                      if (run['a:t']) {
                        content += run['a:t'][0];
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      const slideNumber = parseInt(slideFile.match(/slide(\d+)/)[1]);
      slides.push({
        title: `슬라이드 ${slideNumber}`,
        content: content,
        images: slideImages[slideNumber] || [],
        number: slideNumber
      });
    }

    try {
      fs.unlinkSync(pptxPath);
    } catch (error) {
      console.error('임시 파일 삭제 실패:', error);
    }

    const presentationData = {
      _id: presentationId,
      fileName: decodeURIComponent(req.file.originalname),
      uploadDate: new Date().toISOString(),
      slides: slides
    };

    const presentationFile = path.join(PRESENTATIONS_DIR, `${presentationData._id}.json`);
    fs.writeFileSync(presentationFile, JSON.stringify(presentationData, null, 2), 'utf8');

    const index = loadIndex();
    index.push({
      _id: presentationData._id,
      fileName: presentationData.fileName,
      uploadDate: presentationData.uploadDate
    });
    saveIndex(index);

    res.json({ slides });
  } catch (error) {
    console.error('PPT 파싱 오류:', error);
    res.status(500).json({ error: 'PPT 파일 처리 중 오류가 발생했습니다.' });
  }
});

// 프레젠테이션 저장
app.post('/presentations', (req, res) => {
  try {
    const { slides } = req.body;
    const presentationId = Date.now().toString();
    
    const presentationData = {
      _id: presentationId,
      fileName: `edited_${presentationId}.pptx`,
      uploadDate: new Date().toISOString(),
      slides: slides.map((slide, index) => ({
        title: `슬라이드 ${index + 1}`,
        content: slide.text || '',
        images: slide.image ? [slide.image] : [],
        number: index + 1
      }))
    };

    const presentationFile = path.join(PRESENTATIONS_DIR, `${presentationData._id}.json`);
    fs.writeFileSync(presentationFile, JSON.stringify(presentationData, null, 2), 'utf8');

    const index = loadIndex();
    index.push({
      _id: presentationData._id,
      fileName: presentationData.fileName,
      uploadDate: presentationData.uploadDate
    });
    saveIndex(index);

    res.json({ 
      message: '프레젠테이션이 성공적으로 저장되었습니다.',
      presentationId: presentationData._id
    });
  } catch (error) {
    console.error('프레젠테이션 저장 실패:', error);
    res.status(500).json({ error: '프레젠테이션 저장 중 오류가 발생했습니다.' });
  }
});

// 이미지 목록 조회
app.get('/api/images', (req, res) => {
  try {
    const images = fs.readdirSync(IMAGES_DIR)
      .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
      .map(file => `/images/${file}`);
    res.json(images);
  } catch (error) {
    console.error('이미지 목록 조회 실패:', error);
    res.status(500).json({ error: '이미지 목록을 불러오는데 실패했습니다.' });
  }
});

// 이미지 서빙
app.use('/images', express.static(IMAGES_DIR));

// 임시 파일 정리 함수
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;
      
      // 1시간 이상 된 파일 삭제
      if (fileAge > 3600000) {
        fs.unlinkSync(filePath);
        console.log(`임시 파일 삭제됨: ${file}`);
      }
    });
  } catch (error) {
    console.error('임시 파일 정리 중 오류 발생:', error);
  }
}

// 주기적으로 임시 파일 정리 (1시간마다)
setInterval(cleanupTempFiles, 3600000);

// PPT를 PDF로 변환
app.post('/presentations/:id/export-pdf', async (req, res) => {
  try {
    const presentationId = req.params.id;
    const { slides } = req.body;
    const pptx = new PptxGenJS();

    // 각 슬라이드를 PPT로 변환
    for (const slide of slides) {
      const pptxSlide = pptx.addSlide();
      
      // 이미지 추가
      if (slide.image) {
        try {
          const imagePath = slide.image.replace('/images/', '');
          const fullImagePath = path.join(IMAGES_DIR, imagePath);
          
          if (fs.existsSync(fullImagePath)) {
            const imageBuffer = fs.readFileSync(fullImagePath);
            const imageBase64 = imageBuffer.toString('base64');
            const imageExt = path.extname(fullImagePath).toLowerCase();
            const imageType = imageExt === '.png' ? 'png' : 'jpeg';
            
            // 이미지를 슬라이드의 60% 크기로 설정하고 중앙에 배치
            pptxSlide.addImage({
              data: `data:image/${imageType};base64,${imageBase64}`,
              x: '20%', // 왼쪽에서 20% 위치
              y: '15%', // 위에서 15% 위치
              w: '60%', // 슬라이드 너비의 60%
              h: '50%', // 슬라이드 높이의 50%
              sizing: {
                type: 'contain',
                w: '60%',
                h: '50%'
              }
            });
            console.log(`이미지 추가 성공: ${imagePath}`);
          } else {
            console.log(`이미지 파일 없음: ${fullImagePath}`);
          }
        } catch (error) {
          console.error('이미지 추가 실패:', error);
        }
      }
      
      // 텍스트 추가 (이미지 아래에 배치)
      if (slide.content) {
        pptxSlide.addText(slide.content, {
          x: '10%',
          y: '70%', // 이미지 아래에 배치
          w: '80%',
          h: '25%',
          fontSize: 18,
          color: '363636',
          valign: 'top',
          align: 'center'
        });
      }
    }

    // PPT 파일 저장
    const pptxFileName = `${presentationId}.pptx`;
    const pptxFilePath = path.join(TEMP_DIR, pptxFileName);
    await pptx.writeFile({ fileName: pptxFilePath });

    res.json({
      message: 'PPT 파일이 생성되었습니다.',
      pptxUrl: `/temp/${pptxFileName}`
    });

  } catch (error) {
    console.error('PPT 생성 실패:', error);
    res.status(500).json({ error: 'PPT 생성 중 오류가 발생했습니다.' });
  }
});

// 임시 파일 서빙
app.use('/temp', express.static(TEMP_DIR));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log('이미지 디렉토리:', IMAGES_DIR);
  console.log('임시 파일 디렉토리:', TEMP_DIR);
  
  // 서버 시작 시 임시 파일 정리
  cleanupTempFiles();
}); 