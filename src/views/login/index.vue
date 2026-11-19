<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { Role } from '@/types'
import { clearRemember, loadRemember, login as establishSession, saveRemember } from '@/stores/session'

/**
 * 登录页可配置文案与角色解析（规范源，默认保持租户端现状）。
 * 家族端复制本目录后仅改此处默认值，动画逻辑零改动。
 */
interface LoginProps {
  title?: string
  subtitle?: string
  accountPlaceholder?: string
  resolveRole?: (account: string) => Role
  homePathOf?: (role: Role) => string
}

const props = withDefaults(defineProps<LoginProps>(), {
  title: '家族租户管理系统',
  subtitle: '管理家族租户账号',
  accountPlaceholder: '429108139',
  resolveRole: () => 'dev' as Role,
  homePathOf: () => '/',
})

/* -------------------------------------------------------------------------- */
/*                                    类型                                     */
/* -------------------------------------------------------------------------- */
type CharacterKey = 'purple' | 'black' | 'orange' | 'yellow'
type PoseMode = 'neutral' | 'username' | 'sneak' | 'away'
type MouthState = 'none' | 'sad' | 'happy'

interface Offset {
  x: number
  y: number
}

interface CharacterFace extends Offset {
  skew: number
}

interface EyeEntry {
  el: HTMLElement
  char: CharacterKey
}

interface ConfettiPiece {
  id: number
  style: Record<string, string>
}

/* -------------------------------------------------------------------------- */
/*                                  表单状态                                   */
/* -------------------------------------------------------------------------- */

const username = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const usernameFocused = ref(false)
const loading = ref(false)
const loginSuccess = ref(false)
const loginFailed = ref(false)
const formError = ref('')
const errors = reactive({ username: '', password: '' })

const router = useRouter()

// 刷新后仅恢复「记住密码」偏好；token 由 session 单例自行恢复
onMounted(() => {
  const saved = loadRemember()
  if (!saved) return
  username.value = saved.account
  password.value = saved.password
  remember.value = true
})

const passwordInput = ref<HTMLInputElement | null>(null)

/** 密码已输入且当前是明文 */
const revealPassword = computed(() => showPassword.value && password.value.length > 0)

/** 当前整体姿态：中立 / 看邮箱 / 偷看密文密码 / 集体回避 */
const mode = computed<PoseMode>(() => {
  if (loginSuccess.value) return 'neutral'
  if (revealPassword.value) return 'away'
  if (usernameFocused.value) return 'username'
  if (password.value.length > 0) return 'sneak'
  return 'neutral'
})

/** 只有登录结果才会让小人们动嘴 */
const mouthState = computed<MouthState>(() => {
  if (loginFailed.value) return 'sad'
  if (loginSuccess.value) return 'happy'
  return 'none'
})

/* -------------------------------------------------------------------------- */
/*                                  动画状态                                   */
/* -------------------------------------------------------------------------- */
const stageEl = ref<HTMLElement | null>(null)
const purpleEl = ref<HTMLElement | null>(null)
const blackEl = ref<HTMLElement | null>(null)
const orangeEl = ref<HTMLElement | null>(null)
const yellowEl = ref<HTMLElement | null>(null)

/** 入场动画结束后才接管 transform，避免两套动画打架 */
const entered = ref(false)
/** 紫色小人正在偷看 */
const purplePeek = ref(false)

const blinking = reactive<Record<CharacterKey, boolean>>({
  purple: false,
  black: false,
  orange: false,
  yellow: false,
})

const faces = reactive<Record<CharacterKey, CharacterFace>>({
  purple: { x: 0, y: 0, skew: 0 },
  black: { x: 0, y: 0, skew: 0 },
  orange: { x: 0, y: 0, skew: 0 },
  yellow: { x: 0, y: 0, skew: 0 },
})

const centers: Record<CharacterKey, Offset> = {
  purple: { x: 0, y: 0 },
  black: { x: 0, y: 0 },
  orange: { x: 0, y: 0 },
  yellow: { x: 0, y: 0 },
}

const pointer = { x: 0, y: 0 }

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* -------------------------------------------------------------------------- */
/*                                 工具 & 计时                                 */
/* -------------------------------------------------------------------------- */
const timers = new Set<number>()

/** setTimeout 统一登记，组件卸载时一次性清理 */
function later(fn: () => void, delay: number): number {
  const id = window.setTimeout(() => {
    timers.delete(id)
    fn()
  }, delay)
  timers.add(id)
  return id
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function skew(deg: number): string {
  return `skewX(${deg.toFixed(2)}deg)`
}


/* -------------------------------------------------------------------------- */
/*                                 眼睛跟随逻辑                                 */
/* -------------------------------------------------------------------------- */
const pupilMax: Record<CharacterKey, number> = {
  purple: 5,
  black: 4,
  orange: 5,
  yellow: 5,
}

/**
 * 强制视线（px）：用于“对视”“回避”“偷看”“开心/难过”等状态。
 * 没有配置的角色继续用鼠标位置计算瞳孔落点。
 */
const forcedLook = computed<Partial<Record<CharacterKey, Offset>>>(() => {
  if (loginFailed.value) {
    return {
      purple: { x: 0, y: 1 },
      black: { x: 0, y: 2 },
      orange: { x: 0, y: 1 },
      yellow: { x: 0, y: 1 },
    }
  }
  if (loginSuccess.value) {
    return {
      purple: { x: 0, y: -5 },
      black: { x: 0, y: -5 },
      orange: { x: 0, y: -5 },
      yellow: { x: 0, y: -5 },
    }
  }
  if (mode.value === 'away') {
    return {
      // 紫色：大部分时间也在回避，偶尔瞟一眼右边的密码框
      purple: purplePeek.value ? { x: 4, y: 5 } : { x: -4, y: -4 },
      black: { x: -4, y: -4 },
      orange: { x: -5, y: -4 },
      yellow: { x: -5, y: -4 },
    }
  }
  if (mode.value === 'username') {
    // 紫色和黑色互相使眼色
    return {
      purple: { x: 3, y: 4 },
      black: { x: 0, y: -4 },
    }
  }
  return {}
})

let eyeEntries: EyeEntry[] = []

function collectEyes(): void {
  const root = stageEl.value
  if (!root) return
  eyeEntries = Array.from(root.querySelectorAll<HTMLElement>('.eye')).map((el) => ({
    el,
    char: (el.dataset.char ?? 'purple') as CharacterKey,
  }))
}

/**
 * 没有强制视线时，读取每只眼睛的实际屏幕位置，
 * 让两只瞳孔各自朝鼠标“对焦”，而不是整组平移。
 */
function updatePupils(): void {
  const forced = forcedLook.value

  for (const { el, char } of eyeEntries) {
    let dx = 0
    let dy = 0
    const look = forced[char]

    if (look) {
      dx = look.x
      dy = look.y
    } else {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const deltaX = pointer.x - cx
      const deltaY = pointer.y - cy
      const distance = Math.min(Math.hypot(deltaX, deltaY), pupilMax[char])
      const angle = Math.atan2(deltaY, deltaX)
      dx = Math.cos(angle) * distance
      dy = Math.sin(angle) * distance
    }

    el.style.setProperty('--look-x', `${dx.toFixed(2)}px`)
    el.style.setProperty('--look-y', `${dy.toFixed(2)}px`)
  }
}

/* --------------------------- 角色重心 / 身体倾斜 --------------------------- */
function measureCharacters(): void {
  const pairs: Array<[CharacterKey, HTMLElement | null]> = [
    ['purple', purpleEl.value],
    ['black', blackEl.value],
    ['orange', orangeEl.value],
    ['yellow', yellowEl.value],
  ]

  for (const [key, el] of pairs) {
    if (!el) continue
    const rect = el.getBoundingClientRect()
    centers[key] = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 3,
    }
  }
}

function calculateFace(
  center: Offset,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): CharacterFace {
  const deltaX = pointer.x - center.x
  const deltaY = pointer.y - center.y
  const spanX = Math.max(Math.abs(minX), Math.abs(maxX))
  const spanY = Math.max(Math.abs(minY), Math.abs(maxY))

  return {
    x: clamp(deltaX / (300 / spanX), minX, maxX),
    y: clamp(deltaY / (300 / spanY), minY, maxY),
    skew: clamp(-deltaX / 120, -6, 6),
  }
}

function updateFaces(): void {
  faces.purple = calculateFace(centers.purple, -46, 18, -8, 5)
  faces.black = calculateFace(centers.black, -15, 15, -10, 10)
  faces.orange = calculateFace(centers.orange, -46, 20, -18, 20)
  faces.yellow = calculateFace(centers.yellow, -15, 15, -10, 10)
}

/* -------------------------------- 帧调度 -------------------------------- */
let frameId = 0

function scheduleFrame(): void {
  if (frameId) return
  frameId = window.requestAnimationFrame(() => {
    frameId = 0
    updateFaces()
    updatePupils()
  })
}

function onPointerMove(event: PointerEvent): void {
  pointer.x = event.clientX
  pointer.y = event.clientY
  scheduleFrame()
}

function onResize(): void {
  measureCharacters()
  scheduleFrame()
}

/* --------------------------------- 眨眼 --------------------------------- */
function scheduleBlink(key: CharacterKey): void {
  later(
    () => {
      blinking[key] = true
      later(() => {
        blinking[key] = false
        scheduleBlink(key)
      }, 140)
    },
    2800 + Math.random() * 4200,
  )
}

/* ------------------------------ 紫色偷看循环 ------------------------------ */
let peekTimer = 0
let peekOffTimer = 0

function stopPeek(): void {
  if (peekTimer) window.clearTimeout(peekTimer)
  if (peekOffTimer) window.clearTimeout(peekOffTimer)
  peekTimer = 0
  peekOffTimer = 0
  purplePeek.value = false
}

function startPeek(): void {
  stopPeek()
  if (reducedMotion) return

  const schedule = () => {
    peekTimer = later(
      () => {
        purplePeek.value = true
        peekOffTimer = later(() => {
          purplePeek.value = false
          schedule()
        }, 900)
      },
      3600 + Math.random() * 1400,
    )
  }

  schedule()
}

/* -------------------------------------------------------------------------- */
/*                                  彩带效果                                   */
/* -------------------------------------------------------------------------- */
const confetti = ref<ConfettiPiece[]>([])
const CONFETTI_COLORS = ['#6c3ff5', '#ff9b6b', '#e8d754', '#4ecdc4', '#ff6b6b', '#4d96ff', '#ffffff']

function launchConfetti(): void {
  if (reducedMotion) return

  confetti.value = Array.from({ length: 80 }, (_, index) => ({
    id: index,
    style: {
      left: `${Math.random() * 100}%`,
      '--c': CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      '--w': `${4 + Math.random() * 6}px`,
      '--h': `${8 + Math.random() * 10}px`,
      '--delay': `${Math.random() * 0.9}s`,
      '--dur': `${3.2 + Math.random() * 2.2}s`,
      '--drift': `${(Math.random() - 0.5) * 260}px`,
      '--rot': `${Math.random() * 360}deg`,
    },
  }))

  later(() => {
    confetti.value = []
  }, 7000)
}

/* -------------------------------------------------------------------------- */
/*                                  表单逻辑                                   */
/* -------------------------------------------------------------------------- */
function validate(): boolean {
  errors.username = ''
  errors.password = ''

  const value = username.value.trim()
  if (!value) errors.username = '请输入账号！'

  if (!password.value) errors.password = '请输入密码！'
  else if (password.value.length < 6) errors.password = '密码必须在6个字符以上！'

  return !errors.username && !errors.password
}

function showFailure(message: string): void {
  formError.value = message
  loginFailed.value = true
  later(() => {
    loginFailed.value = false
  }, 2600)
}

function togglePassword(): void {
  showPassword.value = !showPassword.value
  // 切换明文/密文后把焦点还给输入框，光标保持在末尾
  nextTick(() => {
    const input = passwordInput.value
    if (!input) return
    input.focus()
    const end = input.value.length
    input.setSelectionRange(end, end)
  })
}

/**
 * 演示用登录：这里只做前端模拟。
 * 接入真实接口时，把 sleep + loginSuccess 换成你的请求即可。
 */
async function handleSubmit(): Promise<void> {
  if (loading.value) return

  formError.value = ''
  loginSuccess.value = false

  if (!validate()) {
    showFailure('账号或密码错误，请重试。')
    return
  }

  loading.value = true
  try {
    const role = props.resolveRole(username.value)
    establishSession(username.value, role)
    if (remember.value) saveRemember(username.value, password.value)
    else clearRemember()
    router.push(props.homePathOf(role))
    loginSuccess.value = true
    showPassword.value = false
    launchConfetti()
    later(() => {
      loginSuccess.value = false
    }, 5600)
  } finally {
    loading.value = false
  }
}

watch(username, () => {
  if (errors.username) errors.username = ''
})
watch(password, () => {
  if (errors.password) errors.password = ''
})

// 明文密码展示期间，给紫色小人安排“偷看”
watch(
  [revealPassword, loginSuccess],
  ([reveal, success]) => {
    if (reveal && !success) startPeek()
    else stopPeek()
  },
  { immediate: true },
)

/* -------------------------------------------------------------------------- */
/*                                位置 / 姿态样式                               */
/* -------------------------------------------------------------------------- */
const pose = computed(() => {
  const current = mode.value
  const purple = faces.purple
  const black = faces.black
  const orange = faces.orange
  const yellow = faces.yellow
  const away = current === 'away'

  return {
    purple: {
      eyes: away
        ? { left: '20px', top: '35px' }
        : current === 'username'
          ? { left: '55px', top: '65px' }
          : { left: `${75 + purple.x}px`, top: `${25 + purple.y}px` },
      mouth:
        current === 'away'
          ? { left: '72px', top: '57px' }
          : current === 'username'
            ? { left: '80px', top: '95px' }
            : { left: `${97 + purple.x}px`, top: `${57 + purple.y}px` },
    },
    black: {
      eyes: away
        ? { left: '10px', top: '28px' }
        : current === 'username'
          ? { left: '32px', top: '12px' }
          : { left: `${26 + black.x}px`, top: `${32 + black.y}px` },
    },
    orange: {
      eyes: away
        ? { left: '50px', top: '85px' }
        : { left: `${112 + orange.x}px`, top: `${60 + orange.y}px` },
      mouth: away
        ? { left: '94px', top: '118px' }
        : { left: `${126 + orange.x}px`, top: `${92 + orange.y}px` },
    },
    yellow: {
      eyes: away
        ? { left: '20px', top: '35px' }
        : { left: `${52 + yellow.x}px`, top: `${40 + yellow.y}px` },
      mouth: away ? { left: '10px', top: '88px' } : { left: '25px', top: '78px' },
    },
  }
})

const purpleStyle = computed<CSSProperties>(() => {
  const lean = mode.value === 'username' || mode.value === 'sneak'
  const height = lean ? '440px' : '400px'
  if (!entered.value) return { height }

  const s = faces.purple.skew
  let transform: string

  if (mode.value === 'away') transform = 'skewX(0deg)'
  else if (mode.value === 'username') transform = `${skew(s - 12)} translateX(40px)`
  else if (mode.value === 'sneak') transform = `${skew(s - 12)} translateX(40px)`
  else transform = skew(s)

  return { height, transform }
})

const blackStyle = computed<CSSProperties>(() => {
  if (!entered.value) return {}
  const s = faces.black.skew

  if (mode.value === 'away') return { transform: 'skewX(0deg)' }
  if (mode.value === 'username') return { transform: `${skew(s * 1.5 + 10)} translateX(20px)` }
  if (mode.value === 'sneak') return { transform: skew(s * 1.5) }
  return { transform: skew(s * 1.2) }
})

const orangeStyle = computed<CSSProperties>(() => {
  if (!entered.value) return {}
  if (mode.value === 'away') return { transform: 'skewX(0deg)' }
  return { transform: skew(faces.orange.skew) }
})

const yellowStyle = computed<CSSProperties>(() => {
  if (!entered.value) return {}
  if (mode.value === 'away') return { transform: 'skewX(0deg)' }
  return { transform: skew(faces.yellow.skew) }
})

/* -------------------------------------------------------------------------- */
/*                                  生命周期                                   */
/* -------------------------------------------------------------------------- */
onMounted(() => {
  collectEyes()
  measureCharacters()

  pointer.x = window.innerWidth / 2
  pointer.y = window.innerHeight / 3

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })

  if (reducedMotion) {
    entered.value = true
    nextTick(() => {
      measureCharacters()
      updatePupils()
    })
    return
  }

  later(() => {
    entered.value = true
    nextTick(() => {
      measureCharacters()
      scheduleFrame()
    })
  }, 1350)

  for (const key of ['purple', 'black', 'orange', 'yellow'] as CharacterKey[]) {
    scheduleBlink(key)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('resize', onResize)

  if (frameId) window.cancelAnimationFrame(frameId)
  for (const id of timers) window.clearTimeout(id)
  timers.clear()
  stopPeek()
})

// 状态变化后眼睛位置会移动，重新计算瞳孔落点
watch([mode, purplePeek, loginFailed, loginSuccess, usernameFocused], () => {
  nextTick(() => scheduleFrame())
})
</script>

<template>
  <div class="login-page">
    <div class="login-shell">
      <!-- 左侧：深色角色舞台 -->
      <aside class="scene">
        <div class="scene__grid" aria-hidden="true" />
        <div class="scene__glow scene__glow--one" aria-hidden="true" />
        <div class="scene__glow scene__glow--two" aria-hidden="true" />
        <div class="scene__characters">
          <div ref="stageEl" class="stage" aria-hidden="true">
            <div class="characters" :class="{ 'is-entered': entered }">
              <!-- 紫色高个子 -->
              <div ref="purpleEl" class="char char--purple" :class="{ 'is-peeking': purplePeek }" :style="purpleStyle">
                <div class="eyes" :style="pose.purple.eyes">
                  <span class="eye" data-char="purple" :class="{ 'is-blinking': blinking.purple }">
                    <span class="pupil" />
                  </span>
                  <span class="eye" data-char="purple" :class="{ 'is-blinking': blinking.purple }">
                    <span class="pupil" />
                  </span>
                </div>
                <span v-if="mouthState !== 'none'" class="mouth mouth--purple" :class="`is-${mouthState}`"
                  :style="pose.purple.mouth" />
              </div>

              <!-- 黑色小个子 -->
              <div ref="blackEl" class="char char--black" :class="{ 'is-sad': loginFailed }" :style="blackStyle">
                <div class="eyes" :style="pose.black.eyes">
                  <span class="eye" data-char="black" :class="{ 'is-blinking': blinking.black }">
                    <span class="pupil" />
                  </span>
                  <span class="eye" data-char="black" :class="{ 'is-blinking': blinking.black }">
                    <span class="pupil" />
                  </span>
                </div>
              </div>

              <!-- 橙色半圆 -->
              <div ref="orangeEl" class="char char--orange" :style="orangeStyle">
                <div class="eyes" :style="pose.orange.eyes">
                  <span class="eye" data-char="orange" :class="{ 'is-blinking': blinking.orange }">
                    <span class="pupil" />
                  </span>
                  <span class="eye" data-char="orange" :class="{ 'is-blinking': blinking.orange }">
                    <span class="pupil" />
                  </span>
                </div>
                <span v-if="mouthState !== 'none'" class="mouth mouth--orange" :class="`is-${mouthState}`"
                  :style="pose.orange.mouth" />
              </div>

              <!-- 黄色圆角柱 -->
              <div ref="yellowEl" class="char char--yellow" :style="yellowStyle">
                <div class="eyes" :style="pose.yellow.eyes">
                  <span class="eye" data-char="yellow" :class="{ 'is-blinking': blinking.yellow }">
                    <span class="pupil" />
                  </span>
                  <span class="eye" data-char="yellow" :class="{ 'is-blinking': blinking.yellow }">
                    <span class="pupil" />
                  </span>
                </div>
                <span class="mouth mouth--yellow" :style="pose.yellow.mouth" />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧：登录表单 -->
      <main class="panel">
        <div class="card" :class="{ 'is-shaking': loginFailed }">
          <header class="card__header">
            <div class="font36">{{ title }}</div>
            <div class="font24">{{ subtitle }}</div>
          </header>

          <form class="form" novalidate @submit.prevent="handleSubmit">
            <div class="field">
              <label class="field__label" for="login-username">账号</label>
              <input id="login-username" v-model="username" class="field__input" type="text" name="username"
                autocomplete="username" :placeholder="accountPlaceholder" :aria-invalid="Boolean(errors.username)"
                :aria-describedby="errors.username ? 'login-username-error' : undefined" @focus="usernameFocused = true"
                @blur="usernameFocused = false" />
              <p v-if="errors.username" id="login-username-error" class="field__error" role="alert">
                {{ errors.username }}
              </p>
            </div>

            <div class="field">
              <label class="field__label" for="login-password">密码</label>
              <div class="field__control">
                <input id="login-password" ref="passwordInput" v-model="password"
                  class="field__input field__input--password" :type="showPassword ? 'text' : 'password'" name="password"
                  autocomplete="current-password" placeholder="••••••••" :aria-invalid="Boolean(errors.password)"
                  :aria-describedby="errors.password ? 'login-password-error' : undefined" />
                <button type="button" class="field__toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                  :aria-pressed="showPassword" @click="togglePassword">
                  <svg v-if="showPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path
                      d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path
                      d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                    <path
                      d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                    <path d="m2 2 20 20" />
                  </svg>
                </button>
              </div>
              <p v-if="errors.password" id="login-password-error" class="field__error font18" role="alert">
                {{ errors.password }}
              </p>
            </div>

            <div class="form__row">
              <label class="checkbox">
                <input v-model="remember" class="checkbox__input" type="checkbox" />
                <span class="checkbox__box" aria-hidden="true">
                  <svg viewBox="0 0 12 10" width="12" height="10" fill="none">
                    <path d="M1 5.2 4.2 8.4 11 1.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="checkbox__label font18">记住密码</span>
              </label>
            </div>

            <Transition name="fade">
              <p v-if="formError" class="form__error font18" role="alert">{{ formError }}</p>
            </Transition>

            <Transition name="fade">
              <p v-if="loginSuccess" class="form__success" role="status">
                登录成功!
              </p>
            </Transition>

            <button class="button button--primary" type="submit" :disabled="loading || loginSuccess">
              <span class="button__text font18">
                {{ loading ? '登录中...' : loginSuccess ? '欢迎!' : '登录' }}
              </span>
              <span v-if="loading" class="button__spinner" aria-hidden="true" />
              <svg v-else class="button__icon" viewBox="0 0 24 24" width="20" height="20" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>

    <!-- 登录成功彩带 -->
    <div v-if="confetti.length" class="confetti" aria-hidden="true">
      <span v-for="piece in confetti" :key="piece.id" class="confetti__piece" :style="piece.style" />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ---------------------------------- 变量 ---------------------------------- */
$purple: #6c3ff5;
$ink: #2d2d2d;
$orange: #ff9b6b;
$yellow: #e8d754;

$dark: #262626;
$text: #0a0a0a;
$muted: #737373;
$line: rgba(229, 229, 229, 0.9);
$danger: #dc2626;
$success: #15803d;

$ease: cubic-bezier(0.4, 0, 0.2, 1);
$spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* ---------------------------------- 页面 ---------------------------------- */
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #fff;
  color: $text;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: clip;
}

.login-shell {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1292px;
  min-height: 100vh;
}

/* ---------------------------------- 左侧 ---------------------------------- */
.scene {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem;
  color: #fafafa;
  background: linear-gradient(135deg, #2f2f2f 0%, #262626 52%, #1c1c1c 100%);
  overflow: hidden;
  isolation: isolate;
}

.scene__grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: radial-gradient(circle at 50% 42%, #000 0%, transparent 78%);
}

.scene__glow {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;

  &--one {
    top: 25%;
    right: 25%;
    width: 16rem;
    height: 16rem;
    background: rgba(255, 255, 255, 0.1);
  }

  &--two {
    bottom: 25%;
    left: 25%;
    width: 24rem;
    height: 24rem;
    background: rgba(255, 255, 255, 0.05);
  }
}

.brand {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
  color: inherit;
  font-size: 1.125rem;
  font-weight: 400;
  letter-spacing: -0.01em;
  text-decoration: none;
}

.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
}

.scene__characters {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: clamp(400px, 64.5vh, 630px);
}

.scene__footer {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 2rem;
  font-size: 0.875rem;

  a {
    color: rgba(250, 250, 250, 0.6);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #fafafa;
    }
  }
}

/* --------------------------------- 角色舞台 -------------------------------- */
.stage {
  --stage-scale: 1;

  position: relative;
  width: 550px;
  height: 400px;
  transform: scale(var(--stage-scale));
  transform-origin: bottom center;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -14px;
    width: 420px;
    height: 22px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.35);
    filter: blur(14px);
    transform: translateX(-50%);
    pointer-events: none;
  }
}

.characters {
  position: relative;
  width: 100%;
  height: 100%;
}

.char {
  position: absolute;
  bottom: 0;
  transform-origin: center bottom;
  transition: transform 0.7s ease-in-out, height 0.5s ease-in-out;
  will-change: transform;
}

.char--purple {
  left: 70px;
  z-index: 1;
  width: 180px;
  height: 400px;
  border-radius: 10px 10px 0 0;
  background: $purple;
  animation: enter-purple 1.1s $spring both;
}

.char--black {
  left: 240px;
  z-index: 2;
  width: 120px;
  height: 310px;
  border-radius: 8px 8px 0 0;
  background: $ink;
  animation: enter-black 1s $spring 0.2s both;
}

.char--orange {
  left: 0;
  z-index: 3;
  width: 240px;
  height: 200px;
  border-radius: 120px 120px 0 0;
  background: $orange;
  animation: enter-orange 1.05s $spring 0.1s both;
}

.char--yellow {
  left: 310px;
  z-index: 4;
  width: 140px;
  height: 230px;
  border-radius: 70px 70px 0 0;
  background: $yellow;
  animation: enter-yellow 1s $spring 0.3s both;
}

.characters.is-entered .char {
  animation: none;
}

/* --------------------------------- 眼睛 ---------------------------------- */
.eyes {
  position: absolute;
  display: flex;
  transition: left 0.7s ease-in-out, top 0.7s ease-in-out;
  will-change: left, top;
}

.eye {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: #fff;
  transition: height 0.16s ease, border-radius 0.2s ease, transform 0.3s $ease;
}

.pupil {
  display: block;
  border-radius: 50%;
  background: $ink;
  transform: translate(var(--look-x, 0px), var(--look-y, 0px));
  transition: transform 0.1s ease-out, opacity 0.12s ease;
  will-change: transform;
}

/* 各角色眼睛尺寸 */
.char--purple .eyes {
  gap: 32px;
}

.char--purple .eye {
  width: 18px;
  height: 18px;
}

.char--purple .pupil {
  width: 7px;
  height: 7px;
}

.char--black .eyes {
  gap: 24px;
}

.char--black .eye {
  width: 16px;
  height: 16px;
}

.char--black .pupil {
  width: 6px;
  height: 6px;
}

.char--orange .eyes {
  gap: 32px;
  transition-duration: 0.2s;
}

.char--orange .eye {
  width: 12px;
  height: 12px;
  overflow: visible;
  background: transparent;
}

.char--orange .pupil {
  width: 12px;
  height: 12px;
}

.char--yellow .eyes {
  gap: 24px;
  transition-duration: 0.2s;
}

.char--yellow .eye {
  width: 12px;
  height: 12px;
  overflow: visible;
  background: transparent;
}

.char--yellow .pupil {
  width: 12px;
  height: 12px;
}

/* 眨眼 */
.eye.is-blinking {
  height: 2px;
  border-radius: 999px;
}

.eye.is-blinking .pupil {
  opacity: 0;
}

/* 黑色小人难过时的下垂眼 */
.char--black.is-sad .eye {
  height: 9px;
  border-radius: 0 0 9px 9px;
  transform: translateY(3px);
}

.char--black.is-sad .eye:first-child {
  transform: translateY(3px) rotate(-18deg);
}

.char--black.is-sad .eye:last-child {
  transform: translateY(3px) rotate(18deg);
}

.char--black.is-sad .pupil {
  opacity: 0.85;
}

/* --------------------------------- 嘴巴 ---------------------------------- */
.mouth {
  position: absolute;
  background: $ink;
  transition: left 0.7s ease-in-out, top 0.7s ease-in-out, width 0.4s $ease, height 0.4s $ease,
    border-radius 0.4s $ease;
  will-change: left, top;
}

.mouth--purple {
  width: 24px;
  height: 8px;
  border-radius: 0 0 12px 12px;

  &.is-sad {
    width: 22px;
    height: 7px;
    border-radius: 11px 11px 0 0;
  }

  &.is-happy {
    width: 30px;
    height: 15px;
    border-radius: 0 0 15px 15px;
  }
}

.mouth--orange {
  width: 26px;
  height: 13px;
  border-radius: 0 0 13px 13px;

  &.is-sad {
    width: 26px;
    height: 12px;
    border-radius: 13px 13px 0 0;
  }

  &.is-happy {
    width: 32px;
    height: 17px;
    border-radius: 0 0 16px 16px;
  }
}

.mouth--yellow {
  width: 80px;
  height: 4px;
  border-radius: 999px;
}

/* --------------------------------- 入场动画 -------------------------------- */
@keyframes enter-purple {
  0% {
    opacity: 0;
    transform: translate(-150px, 60px) rotate(-14deg) scale(0.3);
  }

  62% {
    opacity: 1;
    transform: translate(10px, -10px) rotate(3deg) scale(1.05);
  }

  100% {
    opacity: 1;
    transform: translate(0, 0) rotate(0) scale(1);
  }
}

@keyframes enter-black {
  0% {
    opacity: 0;
    transform: translateY(70px) scale(0.5);
  }

  70% {
    opacity: 1;
    transform: translateY(-10px) scale(1.08);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes enter-orange {
  0% {
    opacity: 0;
    transform: translate(-200px, 80px) rotate(-24deg) scale(0.2);
  }

  66% {
    opacity: 1;
    transform: translate(15px, -8px) rotate(5deg) scale(1.1);
  }

  100% {
    opacity: 1;
    transform: translate(0, 0) rotate(0) scale(1);
  }
}

@keyframes enter-yellow {
  0% {
    opacity: 0;
    transform: translate(200px, 60px) rotate(20deg) scale(0.3);
  }

  66% {
    opacity: 1;
    transform: translate(-12px, -5px) rotate(-4deg) scale(1.06);
  }

  100% {
    opacity: 1;
    transform: translate(0, 0) rotate(0) scale(1);
  }
}

/* ---------------------------------- 右侧 ---------------------------------- */
.panel {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #fff;
}

.card {
  width: 100%;
  max-width: 420px;

  &.is-shaking {
    animation: shake 0.42s $ease;
  }
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-7px);
  }

  40% {
    transform: translateX(6px);
  }

  60% {
    transform: translateX(-4px);
  }

  80% {
    transform: translateX(3px);
  }
}

.card__brand {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2.5rem;
  color: $text;
  font-size: 1.125rem;

  .brand__mark {
    background: rgba(38, 38, 38, 0.06);
  }
}

.card__header {
  margin-bottom: 2.5rem;
  text-align: center;

  h1 {
    margin: 0 0 0.5rem;
    font-size: 1.875rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.025em;
    color: $text;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: $muted;
  }
}

/* ---------------------------------- 表单 ---------------------------------- */
.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #262626;
}

.field__input {
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  padding: 0 0.75rem;
  border: 1px solid $line;
  border-radius: 8px;
  background: #fff;
  color: $text;
  font-family: inherit;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: rgba(10, 10, 10, 0.35);
  }

  &:hover {
    border-color: #d4d4d4;
  }

  &:focus {
    border-color: #a3a3a3;
    box-shadow: 0 0 0 4px rgba(38, 38, 38, 0.08);
  }

  &[aria-invalid='true'] {
    border-color: rgba(220, 38, 38, 0.65);

    &:focus {
      box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
    }
  }

  /* 隐藏 Edge 自带的密码查看/清除按钮 */
  &::-ms-reveal,
  &::-ms-clear {
    display: none;
  }
}

.field__control {
  position: relative;
}

.field__input--password {
  padding-right: 2.75rem;
}

.field__toggle {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #a3a3a3;
  cursor: pointer;
  transform: translateY(-50%);
  transition: color 0.2s ease;

  &:hover {
    color: $text;
  }

  &:focus-visible {
    outline: 2px solid rgba(38, 38, 38, 0.25);
    outline-offset: 2px;
  }
}

.field__error {
  margin: 0;
  color: $danger;
}

.form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #262626;
  cursor: pointer;
  user-select: none;

  &:hover .checkbox__box {
    border-color: #a3a3a3;
  }
}

.checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.checkbox__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid #d4d4d4;
  border-radius: 4px;
  color: #fff;
  background: #fff;
  transition: background 0.2s ease, border-color 0.2s ease;

  svg {
    opacity: 0;
    transform: scale(0.6);
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
}

.checkbox__input:checked+.checkbox__box {
  border-color: $dark;
  background: $dark;

  svg {
    opacity: 1;
    transform: scale(1);
  }
}

.checkbox__input:focus-visible+.checkbox__box {
  box-shadow: 0 0 0 4px rgba(38, 38, 38, 0.1);
}

.link {
  color: #171717;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.form__error,
.form__success {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.form__error {
  color: $danger;
  background: rgba(220, 38, 38, 0.07);
  border: 1px solid rgba(220, 38, 38, 0.22);
}

.form__success {
  color: $success;
  background: rgba(21, 128, 61, 0.07);
  border: 1px solid rgba(21, 128, 61, 0.2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ---------------------------------- 按钮 ---------------------------------- */
.button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.25s $ease, box-shadow 0.25s $ease, background 0.2s ease,
    border-color 0.2s ease;
}

.button--primary {
  position: relative;
  overflow: hidden;
  border: 0;
  background: $dark;
  color: #fafafa;
  font-size: 1rem;
  font-weight: 500;

  .button__text,
  .button__icon {
    transition: transform 0.25s $ease;
  }

  &:hover:not(:disabled) {
    background: #171717;
    box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.55);

    .button__text {
      transform: translateX(-4px);
    }

    .button__icon {
      transform: translateX(4px);
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.995);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 3px solid rgba(38, 38, 38, 0.2);
    outline-offset: 2px;
  }
}

.button__icon {
  flex: none;
}

.button__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.button--google {
  margin-top: 1.5rem;
  border: 1px solid $line;
  background: #fff;
  color: $text;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    background: #fafafa;
    border-color: #d4d4d4;
  }

  &:active {
    transform: scale(0.995);
  }

  &:focus-visible {
    outline: 3px solid rgba(38, 38, 38, 0.15);
    outline-offset: 2px;
  }
}

.google-icon {
  flex: none;
  color: #404040;
}

.card__signup {
  margin: 2rem 0 0;
  text-align: center;
  font-size: 0.875rem;
  color: $muted;
}

/* ---------------------------------- 彩带 ---------------------------------- */
.confetti {
  position: fixed;
  inset: 0;
  z-index: 40;
  overflow: hidden;
  pointer-events: none;
}

.confetti__piece {
  position: absolute;
  top: -6vh;
  width: var(--w);
  height: var(--h);
  border-radius: 2px;
  background: var(--c);
  opacity: 0;
  animation: confetti-fall var(--dur) linear var(--delay) forwards;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(var(--rot));
  }

  100% {
    opacity: 0.9;
    transform: translate3d(var(--drift), 112vh, 0) rotate(calc(var(--rot) + 720deg));
  }
}

/* ---------------------------------- 响应式 --------------------------------- */
@media (max-width: 1300px) {
  .stage {
    --stage-scale: 0.92;
  }
}

@media (max-width: 1180px) {
  .stage {
    --stage-scale: 0.82;
  }
}

@media (max-width: 1080px) {
  .stage {
    --stage-scale: 0.74;
  }
}

@media (max-height: 800px) and (min-width: 1025px) {
  .stage {
    --stage-scale: 0.85;
  }
}

@media (max-height: 700px) and (min-width: 1025px) {
  .stage {
    --stage-scale: 0.74;
  }
}

@media (max-width: 1024px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .scene {
    display: none;
  }

  .panel {
    min-height: 100vh;
    padding: 2rem 1.25rem;
  }

  .card__brand {
    display: flex;
  }

  .field__input {
    font-size: 1rem;
  }
}

/* --------------------------------- 减少动效 -------------------------------- */
@media (prefers-reduced-motion: reduce) {

  .char,
  .eyes,
  .eye,
  .pupil,
  .mouth,
  .button,
  .button__text,
  .button__icon,
  .fade-enter-active,
  .fade-leave-active {
    transition-duration: 0.01ms !important;
  }

  .char {
    animation: none !important;
  }

  .card.is-shaking {
    animation: none !important;
  }

  .confetti {
    display: none;
  }
}
</style>
