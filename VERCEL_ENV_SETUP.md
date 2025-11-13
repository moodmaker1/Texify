# 🚀 Vercel 환경 변수 설정 가이드

## ⚠️ 중요!

로컬의 `.env.local` 파일은 **Vercel 배포에 포함되지 않습니다.**

Vercel 대시보드에서 직접 설정해야 합니다!

---

## 📋 설정해야 할 환경 변수

```bash
# 필수
GEMINI_API_KEY=your_gemini_api_key

# 권장 (Stable Diffusion 빠르게)
HUGGING_FACE_API_KEY=your_huggingface_token
```

---

## 🔧 Vercel 환경 변수 설정 방법

### **1. Vercel 대시보드 접속**
```
https://vercel.com/dashboard
```

### **2. 프로젝트 선택**
- 배포한 프로젝트 클릭

### **3. Settings 탭**
- 상단 메뉴에서 **"Settings"** 클릭

### **4. Environment Variables**
- 왼쪽 사이드바에서 **"Environment Variables"** 클릭

### **5. 환경 변수 추가**

#### **첫 번째: GEMINI_API_KEY (필수)**
```
Name:  GEMINI_API_KEY
Value: your_actual_gemini_api_key
```
- **Environments 선택**: 
  - ✅ Production
  - ✅ Preview
  - ✅ Development

- **"Add"** 버튼 클릭

#### **두 번째: HUGGING_FACE_API_KEY (권장)**
```
Name:  HUGGING_FACE_API_KEY
Value: hf_your_actual_token
```
- **Environments 선택**:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

- **"Add"** 버튼 클릭

### **6. 재배포 (중요!)**

환경 변수 추가 후 **반드시 재배포**해야 적용됩니다!

#### **방법 1: Vercel 대시보드에서**
```
Deployments 탭 → 최신 배포 → ⋯ 메뉴 → "Redeploy"
```

#### **방법 2: Git Push로**
```bash
git add .
git commit -m "Update environment variables"
git push
```

---

## 📸 스크린샷 가이드

### **Environment Variables 페이지**
```
┌─────────────────────────────────────────┐
│ Environment Variables                    │
├─────────────────────────────────────────┤
│                                          │
│ Name:  [GEMINI_API_KEY              ]   │
│                                          │
│ Value: [your_key_here               ]   │
│                                          │
│ Environments:                            │
│ ☑ Production                            │
│ ☑ Preview                               │
│ ☑ Development                           │
│                                          │
│          [Add]                           │
└─────────────────────────────────────────┘
```

---

## ✅ 확인 방법

### **1. 배포 로그 확인**
```
Vercel 대시보드 → Deployments → 최신 배포 클릭
→ Function Logs 확인
```

### **2. 브라우저 콘솔 확인**
배포된 사이트에서 F12 → Console 탭

#### **정상 작동 시**
```javascript
✅ Gemini 이미지 생성 성공
또는
ℹ️ Gemini API 할당량 제한, Stable Diffusion으로 생성 중...
✅ Stable Diffusion 이미지 생성 성공
```

#### **환경 변수 없을 시 (오류)**
```javascript
❌ 유효한 GEMINI_API_KEY를 .env.local 파일에 설정해주세요.
또는
❌ HUGGING_FACE_API_KEY not found
```

---

## 🔐 보안 주의사항

### **절대 하지 말 것!**
- ❌ API 키를 코드에 직접 작성
- ❌ API 키를 Git에 커밋
- ❌ API 키를 공개 저장소에 노출

### **올바른 방법**
- ✅ Vercel 환경 변수 사용
- ✅ `.env.local`은 `.gitignore`에 포함
- ✅ 환경 변수로만 관리

---

## 🚨 문제 해결

### **문제 1: "API 키가 없다"는 오류**
**원인**: 환경 변수가 설정되지 않음

**해결**:
1. Vercel 대시보드에서 환경 변수 확인
2. `GEMINI_API_KEY` 추가했는지 확인
3. 재배포 실행

### **문제 2: 환경 변수 추가했는데도 안 됨**
**원인**: 재배포 안 함

**해결**:
1. Deployments 탭
2. 최신 배포 → ⋯ 메뉴 → "Redeploy"

### **문제 3: Stable Diffusion이 느림**
**원인**: `HUGGING_FACE_API_KEY` 없음

**해결**:
1. Hugging Face 토큰 발급
2. Vercel에 `HUGGING_FACE_API_KEY` 추가
3. 재배포

---

## 📋 체크리스트

배포 전:
- [ ] `.env.local` 파일 생성 (로컬 테스트용)
- [ ] `.gitignore`에 `.env.local` 포함 확인
- [ ] 로컬에서 정상 작동 확인

배포 후:
- [ ] Vercel 대시보드 접속
- [ ] Settings → Environment Variables
- [ ] `GEMINI_API_KEY` 추가
- [ ] `HUGGING_FACE_API_KEY` 추가 (권장)
- [ ] Environments 3개 모두 선택 (Production, Preview, Development)
- [ ] **재배포 실행** (중요!)
- [ ] 배포된 사이트에서 테스트

---

## 🎯 빠른 설정 (요약)

```bash
1. Vercel 대시보드 접속
   https://vercel.com/dashboard

2. 프로젝트 선택

3. Settings → Environment Variables

4. 추가:
   Name:  GEMINI_API_KEY
   Value: your_gemini_key
   Environments: ✅ 모두 선택

5. 추가:
   Name:  HUGGING_FACE_API_KEY
   Value: hf_your_token
   Environments: ✅ 모두 선택

6. 재배포:
   Deployments → 최신 배포 → Redeploy
```

---

## 🎉 완료!

환경 변수 설정 후:

- ✅ Gemini Imagen 작동
- ✅ Stable Diffusion 작동 (토큰 있으면 빠름)
- ✅ 95% AI 이미지 생성 성공

**재배포 후 배포된 사이트에서 게임 테스트하세요!** 🚀✨

