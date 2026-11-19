<script lang="ts">
export default { name: 'AnimatedCharacters' }
</script>

<script setup lang="ts">
/**
 * AnimatedCharacters
 * 登录页左侧的装饰角色：根据输入状态给出反馈
 * - isTyping：角色前倾、手臂摆动
 * - showPassword：双手遮眼 / 闭眼
 * - passwordLength：头顶气泡显示已输入位数（最多 6 个）
 */
import { computed } from 'vue'

interface Props {
  isTyping?: boolean
  showPassword?: boolean
  passwordLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  isTyping: false,
  showPassword: false,
  passwordLength: 0,
})

const dots = computed(() => Math.min(props.passwordLength, 6))
</script>

<template>
  <div
    class="chars"
    :class="{
      'is-typing': props.isTyping,
      'is-shy': props.showPassword,
    }"
    aria-hidden="true"
  >
    <!-- 密码位数气泡 -->
    <div v-if="dots > 0" class="bubble">
      <i v-for="n in dots" :key="n" class="dot" />
    </div>

    <!-- 角色一：圆形机器人 -->
    <div class="char char-a">
      <div class="antenna">
        <span class="ball" />
        <span class="stick" />
      </div>
      <div class="head">
        <div class="face">
          <span class="eye" />
          <span class="eye" />
          <span class="mouth" />
        </div>
        <span class="cheek cheek-l" />
        <span class="cheek cheek-r" />
      </div>
      <div class="body">
        <span class="arm arm-l" />
        <span class="arm arm-r" />
      </div>
    </div>

    <!-- 角色二：小幽灵 -->
    <div class="char char-b">
      <div class="ghost">
        <div class="face">
          <span class="eye" />
          <span class="eye" />
        </div>
        <span class="blush blush-l" />
        <span class="blush blush-r" />
        <span class="tail tail-1" />
        <span class="tail tail-2" />
      </div>
      <span class="hand hand-l" />
      <span class="hand hand-r" />
    </div>

    <!-- 地面阴影 -->
    <span class="shadow shadow-a" />
    <span class="shadow shadow-b" />
  </div>
</template>

<style scoped lang="scss">
$blue: #3b82f6;
$blue-deep: #1e40af;
$skin: #e8f0ff;
$ink: #0f172a;

.chars {
  position: relative;
  width: 320px;
  height: 340px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 26px;
  user-select: none;
}

// ---------- 通用 ----------
.char {
  position: relative;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.eye {
  width: 10px;
  height: 12px;
  border-radius: 50%;
  background: $ink;
  transition: transform 0.25s ease, height 0.2s ease;
}

// ---------- 角色一 ----------
.char-a {
  width: 132px;

  .antenna {
    position: absolute;
    top: -26px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;

    .stick {
      width: 2px;
      height: 14px;
      background: rgba(255, 255, 255, 0.55);
    }

    .ball {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: $blue;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.9);
      animation: blink 2.4s ease-in-out infinite;

      .is-typing & {
        animation-duration: 0.9s;
      }
    }
  }

  .head {
    position: relative;
    height: 104px;
    border-radius: 46px;
    background: linear-gradient(160deg, #ffffff, #dbeafe 70%);
    box-shadow:
      inset 0 -10px 18px rgba(30, 64, 175, 0.18),
      0 18px 30px -18px rgba(15, 23, 42, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .face {
    display: flex;
    align-items: center;
    gap: 14px;

    .mouth {
      position: absolute;
      left: 50%;
      bottom: 22px;
      width: 14px;
      height: 7px;
      border-bottom: 2px solid rgba(15, 23, 42, 0.65);
      border-radius: 0 0 8px 8px;
      transform: translateX(-50%);
    }
  }

  .cheek {
    position: absolute;
    top: 58px;
    width: 16px;
    height: 8px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.35);
  }

  .cheek-l {
    left: 18px;
  }

  .cheek-r {
    right: 18px;
  }

  .body {
    position: relative;
    height: 74px;
    margin-top: 8px;
    border-radius: 40px 40px 26px 26px;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(147, 197, 253, 0.6));
    box-shadow: inset 0 -8px 16px rgba(30, 64, 175, 0.2);
  }

  .arm {
    position: absolute;
    top: 10px;
    width: 22px;
    height: 44px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.85);
    transform-origin: top center;
    transition: transform 0.35s ease;
  }

  .arm-l {
    left: -16px;
  }

  .arm-r {
    right: -16px;
  }
}

// ---------- 角色二 ----------
.char-b {
  width: 112px;
  margin-bottom: 10px;

  .ghost {
    position: relative;
    height: 118px;
    border-radius: 56px 56px 22px 22px;
    background: linear-gradient(160deg, #c7ddff, #7ea9f7 75%);
    box-shadow:
      inset 0 -8px 16px rgba(15, 23, 42, 0.2),
      0 16px 30px -18px rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(60% 50% at 30% 20%, rgba(255, 255, 255, 0.55), transparent 60%);
    }
  }

  .face {
    position: relative;
    z-index: 2;
    display: flex;
    gap: 20px;
  }

  .blush {
    position: absolute;
    z-index: 2;
    bottom: 26px;
    width: 14px;
    height: 7px;
    border-radius: 50%;
    background: rgba(244, 114, 182, 0.45);
  }

  .blush-l {
    left: 14px;
  }

  .blush-r {
    right: 14px;
  }

  .tail {
    position: absolute;
    bottom: -10px;
    width: 34px;
    height: 24px;
    background: #7ea9f7;
    border-radius: 0 0 20px 20px;
  }

  .tail-1 {
    left: 14px;
  }

  .tail-2 {
    right: 14px;
  }

  .hand {
    position: absolute;
    z-index: 3;
    top: 46px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e8f0ff;
    transition: transform 0.35s ease, top 0.35s ease;
  }

  .hand-l {
    left: 6px;
  }

  .hand-r {
    right: 6px;
  }
}

// ---------- 状态：输入中 / 遮眼 ----------
.is-typing {
  .char-a {
    transform: translateY(-6px) rotate(-2deg);
  }

  .char-b {
    transform: translateY(-3px) rotate(3deg);
  }

  .char-a .arm-l {
    transform: rotate(12deg);
  }

  .char-a .arm-r {
    transform: rotate(-12deg);
  }
}

.is-shy {
  .char-a .eye,
  .char-b .eye {
    height: 3px;
    transform: translateY(2px);
  }

  .char-a .arm-l,
  .char-a .arm-r {
    transform: translateY(-40px) rotate(0deg);
  }

  .char-b .hand-l {
    transform: translate(22px, -18px);
  }

  .char-b .hand-r {
    transform: translate(-22px, -18px);
  }
}

// ---------- 气泡 ----------
.bubble {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(6px);
  animation: pop 0.25s ease;

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #fff;
    opacity: 0.9;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    width: 10px;
    height: 10px;
    background: inherit;
    border-right: 1px solid rgba(255, 255, 255, 0.28);
    border-bottom: 1px solid rgba(255, 255, 255, 0.28);
    transform: translateX(-50%) rotate(45deg);
  }
}

// ---------- 阴影 ----------
.shadow {
  position: absolute;
  bottom: 4px;
  height: 12px;
  border-radius: 50%;
  background: rgba(2, 6, 23, 0.35);
  filter: blur(6px);
}

.shadow-a {
  left: 34px;
  width: 118px;
}

.shadow-b {
  right: 24px;
  width: 96px;
}

// ---------- 动画 ----------
@keyframes blink {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.8);
  }
}

@keyframes pop {
  from {
    opacity: 0;
    transform: translate(-50%, 6px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

// 待机浮动
.char-a {
  animation: float-a 5.2s ease-in-out infinite;
}

.char-b {
  animation: float-b 4.4s ease-in-out infinite;
}

@keyframes float-a {
  0%,
  100% {
    margin-bottom: 0;
  }
  50% {
    margin-bottom: 8px;
  }
}

@keyframes float-b {
  0%,
  100% {
    margin-bottom: 10px;
  }
  50% {
    margin-bottom: 18px;
  }
}
</style>
