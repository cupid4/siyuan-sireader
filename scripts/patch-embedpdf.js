import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const snippetDir = path.join(rootDir, 'node_modules/@embedpdf/snippet/dist')
const rawBundlePath = path.join(snippetDir, 'embedpdf-7TNsu-EA.js')
const outBundlePath = path.join(snippetDir, 'embedpdf-core-ko.js')
const snippetIndexPath = path.join(snippetDir, 'embedpdf.js')

if (!fs.existsSync(rawBundlePath)) {
  console.log('[patch-embedpdf] @embedpdf/snippet dist bundle not found, skipping patch.')
  process.exit(0)
}

console.log('[patch-embedpdf] Patching EmbedPDF for Korean localization...')

let bCode = fs.readFileSync(rawBundlePath, 'utf8')

const cmdKo = '{commands:{zoom:{in:"확대",out:"축소",fitWidth:"너비 맞춤",fitPage:"페이지 맞춤",automatic:"자동",level:"배율 ({level}%)",inArea:"영역 확대"},fullscreen:{enter:"전체 화면",exit:"전체 화면 종료"},rotate:{clockwise:"시계 방향 회전",counterclockwise:"반시계 방향 회전"},menu:"메뉴",sidebar:"사이드바",search:"검색",comment:"댓글",download:"다운로드",print:"인쇄",openFile:"PDF 열기",save:"저장",settings:"설정",view:"읽기",annotate:"주석",shapes:"도형",redact:"가리기",fillAndSign:"작성 및 서명",form:"서식",insert:"삽입",pan:"손 도구",pointer:"선택 도구",undo:"실행 취소",redo:"다시 실행",copy:"복사",screenshot:"화면 캡처",nextPage:"다음 페이지",previousPage:"이전 페이지"},mode:{view:"읽기",annotate:"주석",shapes:"도형",form:"서식",redact:"가리기",insert:"삽입"}}'

// Lazy i18n lookup in resolveLabel
const oldRes = 'resolveLabel(e,t,n){const o=this.resolveDynamic(e.labelKey,t,n);'
const newRes = 'resolveLabel(e,t,n){this.i18n||(this.i18n=this.registry.getPlugin("i18n")?.provides()??null);const o=this.resolveDynamic(e.labelKey,t,n);'
bCode = bCode.replace(oldRes, newRes)

// Fallback labels
bCode = bCode.replace('labelKey:"panel.thumbnails",label:"Thumbnails"', 'labelKey:"panel.thumbnails",label:"미리보기"')
bCode = bCode.replace('labelKey:"panel.outline",label:"Outline"', 'labelKey:"panel.outline",label:"개요"')
bCode = bCode.replace('labelKey:"menu.viewControls",label:"View Controls"', 'labelKey:"menu.viewControls",label:"보기 제어"')
bCode = bCode.replace('labelKey:"menu.zoomControls",label:"Zoom Controls"', 'labelKey:"menu.zoomControls",label:"배율 제어"')
bCode = bCode.replace('defaultConfig:{defaultLocale:"en"', 'defaultConfig:{defaultLocale:"ko"')
bCode = bCode.replace('i18n:{defaultLocale:"en"', 'i18n:{defaultLocale:"ko"')
bCode = bCode.replace('const Qa={currentLocale:"en"', 'const Qa={currentLocale:"ko"')

// Inject Korean commands translations into all locales
bCode = bCode.replace(/locales:\{en:(\w+),es:(\w+)\}/, `locales:{en:${cmdKo},es:${cmdKo},ko:${cmdKo},"zh-CN":${cmdKo},"zh-TW":${cmdKo}}`)

fs.writeFileSync(outBundlePath, bCode, 'utf8')

// Update snippet index
if (fs.existsSync(snippetIndexPath)) {
  let siCode = fs.readFileSync(snippetIndexPath, 'utf8')
  siCode = siCode.replace(/from"\.\/embedpdf-[^"]+\.js"/g, 'from"./embedpdf-core-ko.js?v=2.2.8"')
  fs.writeFileSync(snippetIndexPath, siCode, 'utf8')
}

console.log('[patch-embedpdf] EmbedPDF Korean patch applied successfully.')
