import { Howl } from 'howler';
import type { Scenario } from '../types';

type BGMType = 'horror' | 'thriller' | 'romance' | 'front';
type SoundEffect = 'opening_door' | 'timer_timeout' | 'timer_warning' | 'game_over' | 'action_submit' | 'modal_open' | 'modal_close';

/**
 * 사운드 매니저 - 완전히 새로 작성 (깔끔한 버전)
 */
class SoundManager {
  private static instance: SoundManager;
  
  // 사운드 객체들
  private bgmTracks: Map<BGMType, Howl> = new Map();
  private sfxTracks: Map<SoundEffect, Howl> = new Map();
  
  // 현재 재생 중인 BGM
  private currentBGM: Howl | null = null;
  private currentBGMType: BGMType | null = null;
  
  // 설정
  private isMuted: boolean = false;
  private bgmVolume: number = 0.3;
  private sfxVolume: number = 0.5;
  
  // AudioContext unlock 상태
  private isAudioUnlocked: boolean = false;
  private pendingBGM: BGMType | null = null;

  private constructor() {
    this.loadAllSounds();
    this.setupUserInteractionUnlock();
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * 모든 사운드 파일 로드
   */
  private loadAllSounds() {
    console.log('🎵 Loading all sounds...');

    // BGM 로드
    this.bgmTracks.set('front', new Howl({
      src: ['/sounds/bgm/front_bgm.mp3'],
      loop: true,
      volume: this.bgmVolume,
      preload: true,
      html5: true,
    }));

    this.bgmTracks.set('horror', new Howl({
      src: ['/sounds/bgm/horror__bgm.mp3'],
      loop: true,
      volume: this.bgmVolume,
      preload: true,
      html5: true,
    }));

    this.bgmTracks.set('thriller', new Howl({
      src: ['/sounds/bgm/thriller__bgm.mp3'],
      loop: true,
      volume: this.bgmVolume,
      preload: true,
      html5: true,
    }));

    this.bgmTracks.set('romance', new Howl({
      src: ['/sounds/bgm/romance__bgm.mp3'],
      loop: true,
      volume: this.bgmVolume,
      preload: true,
      html5: true,
    }));

    // SFX 로드
    this.sfxTracks.set('opening_door', new Howl({
      src: ['/sounds/effect/opening_door.mp3'],
      volume: this.sfxVolume,
      preload: true,
    }));

    // 더미 SFX (존재하지 않는 파일들은 무음으로 처리)
    const dummySFX = new Howl({
      src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
      volume: 0,
    });

    this.sfxTracks.set('timer_timeout', dummySFX);
    this.sfxTracks.set('timer_warning', dummySFX);
    this.sfxTracks.set('game_over', dummySFX);
    this.sfxTracks.set('action_submit', dummySFX);
    this.sfxTracks.set('modal_open', dummySFX);
    this.sfxTracks.set('modal_close', dummySFX);

    console.log('✅ All sounds loaded');
  }

  /**
   * 사용자 첫 상호작용 시 AudioContext unlock
   */
  private setupUserInteractionUnlock() {
    const unlockAudio = () => {
      if (this.isAudioUnlocked) return;

      console.log('🔓 Unlocking audio context...');

      // 무음 사운드로 AudioContext 활성화
      const silentSound = new Howl({
        src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
        volume: 0,
      });
      
      silentSound.once('play', () => {
        this.isAudioUnlocked = true;
        console.log('✅ Audio context unlocked!');
        silentSound.unload();
        
        // 🆕 unlock 후 대기 중인 BGM이 있으면 재생
        if (this.pendingBGM) {
          console.log(`▶️ Playing pending BGM: ${this.pendingBGM}`);
          this.playBGM(this.pendingBGM);
          this.pendingBGM = null;
        }
      });

      silentSound.play();
    };

    // 첫 클릭/터치에서 unlock (한 번만)
    document.addEventListener('click', unlockAudio, { once: true, passive: true });
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  }

  /**
   * BGM 재생
   */
  public playBGM(type: Scenario | 'front') {
    const bgmType = type.toLowerCase() as BGMType;
    const bgm = this.bgmTracks.get(bgmType);

    if (!bgm) {
      console.error(`❌ BGM not found: ${bgmType}`);
      return;
    }

    // 🆕 오디오가 아직 unlock되지 않았으면 대기
    if (!this.isAudioUnlocked) {
      console.log(`⏳ Audio not unlocked yet, pending BGM: ${bgmType}`);
      this.pendingBGM = bgmType;
      return;
    }

    // 이미 같은 BGM이 재생 중이면 무시
    if (this.currentBGMType === bgmType && this.currentBGM?.playing()) {
      console.log(`⏩ BGM already playing: ${bgmType}`);
      return;
    }

    // 기존 BGM 정지
    if (this.currentBGM) {
      this.currentBGM.stop();
    }

    // 새 BGM 재생
    this.currentBGM = bgm;
    this.currentBGMType = bgmType;

    if (!this.isMuted) {
      bgm.play();
      console.log(`▶️ Playing BGM: ${bgmType}`);
    } else {
      console.log(`🔇 BGM set (muted): ${bgmType}`);
    }
  }

  /**
   * BGM 정지 (fade-out 포함)
   */
  public stopBGM() {
    if (this.currentBGM) {
      this.currentBGM.fade(this.bgmVolume, 0, 1000);
      setTimeout(() => {
        this.currentBGM?.stop();
        this.currentBGM = null;
        this.currentBGMType = null;
      }, 1000);
      console.log('⏹️ Stopping BGM (with fade)');
    }
  }

  /**
   * BGM 즉시 정지 (fade-out 없이)
   */
  public stopBGMImmediate() {
    if (this.currentBGM) {
      this.currentBGM.stop();
      this.currentBGM = null;
      this.currentBGMType = null;
      console.log('⏹️ Stopping BGM (immediate)');
    }
  }

  /**
   * 효과음 재생
   */
  public playSFX(type: SoundEffect) {
    const sfx = this.sfxTracks.get(type);

    if (!sfx) {
      console.error(`❌ SFX not found: ${type}`);
      return;
    }

    if (!this.isMuted) {
      sfx.play();
      console.log(`🔊 Playing SFX: ${type}`);
    }
  }

  /**
   * 음소거 토글
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      // 음소거: 모든 사운드 정지
      this.currentBGM?.pause();
      this.sfxTracks.forEach(sfx => sfx.stop());
      console.log('🔇 Muted');
    } else {
      // 음소거 해제: BGM 재개
      if (this.currentBGM) {
        this.currentBGM.play();
      }
      console.log('🔊 Unmuted');
    }

    return this.isMuted;
  }

  /**
   * 음소거 상태 확인
   */
  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * BGM 볼륨 설정
   */
  public setBGMVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    this.bgmTracks.forEach(bgm => bgm.volume(this.bgmVolume));
    console.log(`🔊 BGM volume: ${this.bgmVolume}`);
  }

  /**
   * SFX 볼륨 설정
   */
  public setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sfxTracks.forEach(sfx => sfx.volume(this.sfxVolume));
    console.log(`🔊 SFX volume: ${this.sfxVolume}`);
  }

  /**
   * 수동 unlock (필요 시)
   */
  public ensureUnlocked(): boolean {
    return this.isAudioUnlocked;
  }
}

// 싱글톤 인스턴스 export
export const soundManager = SoundManager.getInstance();
