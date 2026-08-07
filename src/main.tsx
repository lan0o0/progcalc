import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

function showError(msg: string) {
  const div = document.createElement('div')
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;padding:16px;background:#1a0000;color:#ff6b6b;font-size:14px;font-family:monospace;z-index:99999;white-space:pre-wrap;word-break:break-all;overflow:auto;'
  div.textContent = msg
  document.body.appendChild(div)
}

// 捕获全局错误
window.addEventListener('error', function (e) {
  const err = (e as ErrorEvent).error || (e as ErrorEvent).message
  showError('JS 错误: ' + (err && err.stack ? err.stack : String(err)))
})
window.addEventListener('unhandledrejection', function (e) {
  const err = (e as PromiseRejectionEvent).reason
  showError('Promise 错误: ' + (err && err.stack ? err.stack : String(err)))
})

function start() {
  try {
    const rootEl = document.getElementById('root')
    if (!rootEl) {
      showError('找不到 #root 元素!readyState=' + document.readyState)
      return
    }
    if (rootEl.nodeType !== 1) {
      showError('#root nodeType=' + rootEl.nodeType + ',应为 1')
      return
    }
    console.log('[ProgCalc] 启动 React,root=', rootEl.tagName)
    const root = createRoot(rootEl)
    root.render(<App />)
    console.log('[ProgCalc] 渲染调用完成')
  } catch (err: any) {
    console.error('[ProgCalc] 启动失败:', err)
    showError('启动失败: ' + (err && err.stack ? err.stack : String(err)))
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start)
} else {
  start()
}
