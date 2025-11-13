# ✅ Vercel 배포 체크리스트

## 🚀 배포 전 준비

### **1. 로컬 환경 변수 설정**
```bash
# .env.local 파일 생성
GEMINI_API_KEY=your_gemini_key
HUGGING_FACE_API_KEY=hf_your_token
```

### **2. 로컬 테스트**
```bash
npm run dev
```
- [ ] 게임 시작 확인
- [ ] 이미지 생성 확인 (콘솔 로그)
- [ ] 음악 재생 확인

### **3. Git 커밋**
```bash
git add .
git commit -m "Final deployment"
git push
```

---

## 🔑 Vercel 환경 변수 설정

### **필수 단계**

1. **Vercel 대시보드 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **프로젝트 선택**

3. **Settings → Environment Variables**

4. **환경 변수 추가**

   **첫 번째: GEMINI_API_KEY**
   ```
   Name:  GEMINI_API_KEY
   Value: [당신의 Gemini API 키]
   Environments: ✅ Production, Preview, Development
   ```

   **두 번째: HUGGING_FACE_API_KEY**
   ```
   Name:  HUGGING_FACE_API_KEY
   Value: [당신의 Hugging Face 토큰]
   Environments: ✅ Production, Preview, Development
   ```

5. **재배포 실행**
   - Deployments 탭
   - 최신 배포 → ⋯ → "Redeploy"

---

## 🧪 배포 후 테스트

### **1. 배포 완료 확인**
- [ ] Vercel에서 "Ready" 상태 확인
- [ ] 배포 로그에서 오류 없는지 확인

### **2. 사이트 접속**
```
https://your-project.vercel.app
```

### **3. 기능 테스트**

#### **메인 화면**
- [ ] 페이지 로드 확인
- [ ] BGM 자동 재생 (첫 클릭 후)
- [ ] 시나리오 카드 표시
- [ ] 음소거 버튼 작동

#### **게임 시작**
- [ ] 시나리오 선택 (Horror, Thriller, Romance)
- [ ] 7초 동영상 재생
- [ ] 효과음 재생 (`opening_door`)
- [ ] 테마 BGM 재생

#### **이미지 생성**

**콘솔에서 확인 (F12 → Console)**

**정상 케이스 1: Gemini**
```javascript
✅ Gemini 이미지 생성 성공
```

**정상 케이스 2: Stable Diffusion**
```javascript
ℹ️ Gemini API 할당량 제한, Stable Diffusion으로 생성 중...
✅ Stable Diffusion 이미지 생성 성공
```

**정상 케이스 3: Placeholder**
```javascript
ℹ️ Gemini API 할당량 제한, Stable Diffusion으로 생성 중...
⚠️ Stable Diffusion 이미지 생성 실패
ℹ️ Stable Diffusion 실패, placeholder 이미지 사용
```

#### **게임 플레이**
- [ ] 스토리 표시
- [ ] 타이머 작동 (60초)
- [ ] 선택지 3개 표시
- [ ] 선택 시 스탯 변화 팝업
- [ ] 다음 스토리 생성

#### **음악/효과음**
- [ ] 메인 화면 BGM (`front_bgm`)
- [ ] 테마 선택 시 효과음 (`opening_door`)
- [ ] 테마 BGM 자동 재생
- [ ] 음소거 버튼 작동
- [ ] 홈 복귀 시 메인 BGM

---

## 🚨 문제 해결

### **문제: "API 키 오류"**

**콘솔 에러:**
```javascript
❌ 유효한 GEMINI_API_KEY를 .env.local 파일에 설정해주세요.
```

**해결:**
1. Vercel 대시보드 → Settings → Environment Variables
2. `GEMINI_API_KEY` 확인
3. 없으면 추가
4. 재배포

---

### **문제: "Stable Diffusion 토큰 오류"**

**콘솔 에러:**
```javascript
⚠️ Stable Diffusion 이미지 생성 실패: HUGGING_FACE_API_KEY not found
```

**해결:**
1. Vercel 대시보드 → Settings → Environment Variables
2. `HUGGING_FACE_API_KEY` 추가
3. 재배포

---

### **문제: "음악 안 나옴"**

**증상:**
- BGM 재생 안 됨
- 효과음 재생 안 됨

**해결:**
1. 브라우저 새로고침 (Ctrl+Shift+R)
2. 페이지 아무 곳이나 클릭 (AudioContext unlock)
3. 콘솔 확인
   ```javascript
   🔓 Attempting audio unlock...
   ✅ Audio unlocked!
   ```

---

### **문제: "이미지 placeholder만 나옴"**

**증상:**
- AI 이미지 생성 안 됨
- 계속 썸네일만 표시

**콘솔 확인:**
```javascript
ℹ️ Gemini API 할당량 제한, Stable Diffusion으로 생성 중...
⚠️ Stable Diffusion 이미지 생성 실패: ...
ℹ️ Stable Diffusion 실패, placeholder 이미지 사용
```

**해결:**
1. **Gemini API 할당량 확인**
   - https://aistudio.google.com/app/apikey
   - 월 1,000회 제한 확인

2. **Hugging Face 토큰 확인**
   - Vercel 환경 변수에 `HUGGING_FACE_API_KEY` 있는지
   - 토큰이 유효한지 확인

3. **재배포**

---

## 📊 성능 모니터링

### **Vercel Analytics**
```
프로젝트 → Analytics 탭
```
- 페이지 로드 시간
- 사용자 수
- 오류 발생률

### **Function Logs**
```
프로젝트 → Deployments → 최신 배포 → Function Logs
```
- API 호출 로그
- 오류 메시지
- 성능 지표

---

## 🎯 최종 체크리스트

### **배포 전**
- [ ] 로컬에서 정상 작동 확인
- [ ] `.env.local` 파일 `.gitignore`에 포함
- [ ] Git push 완료

### **Vercel 설정**
- [ ] `GEMINI_API_KEY` 환경 변수 추가
- [ ] `HUGGING_FACE_API_KEY` 환경 변수 추가
- [ ] Environments 3개 모두 선택
- [ ] **재배포 실행**

### **배포 후 테스트**
- [ ] 사이트 접속 가능
- [ ] 메인 화면 로드
- [ ] BGM 재생
- [ ] 게임 시작
- [ ] 이미지 생성 (콘솔 확인)
- [ ] 스토리 진행
- [ ] 음소거 작동

---

## 🎉 배포 완료!

모든 체크리스트를 완료하셨다면:

✅ **Vercel 배포 성공**  
✅ **환경 변수 설정 완료**  
✅ **AI 이미지 시스템 작동**  
✅ **음악/효과음 작동**  
✅ **게임 정상 작동**

**사이트 링크:**
```
https://your-project.vercel.app
```

**공유하세요!** 🚀✨

