# 🎵 파일 이름 변경 방법

## 만약 format 옵션으로 해결이 안 된다면, 파일 이름을 변경하세요.

### 1. Windows 파일 탐색기에서 변경

```
C:\Temp\data\public\sounds\bgm\ 폴더로 이동

현재 파일명 → 변경할 파일명
-----------------
front    → front.mp3
horror   → horror.mp3
romance  → romance.mp3
thriller → thriller.mp3
```

### 2. PowerShell로 일괄 변경 (빠름!)

PowerShell을 열고 다음 명령어 실행:

```powershell
cd C:\Temp\data\public\sounds\bgm

Rename-Item -Path "front" -NewName "front.mp3"
Rename-Item -Path "horror" -NewName "horror.mp3"
Rename-Item -Path "romance" -NewName "romance.mp3"
Rename-Item -Path "thriller" -NewName "thriller.mp3"
```

### 3. 파일 이름 변경 후 코드 수정

파일 이름을 변경했다면, `soundManager.ts`를 다음과 같이 수정:

```typescript
// format 옵션 제거하고 .mp3 확장자 추가
this.bgm.front = new Howl({
  src: ['/sounds/bgm/front.mp3'],  // ← .mp3 추가
  loop: true,
  volume: this.bgmVolume,
  preload: true,
  html5: true,
  // ...
});
```

---

## 🎯 현재 상태

- ✅ **코드에 format: ['mp3'] 추가됨** (방금 수정)
- ⏳ **먼저 이것으로 테스트해보세요**
- ❌ **안 되면 위 방법으로 파일 이름 변경**

