// 节流函数 用时间戳来判断是否执行函数
export function throttle(func, wait) {
  let previous = 0
  return function(...args) {
    const now = Date.now()
    if (now - previous > wait) {
      func.apply(this, args)
      previous = now
    }
  }
};
// 防抖函数 用时间戳来判断是否执行函数
export function debounce(func, wait) {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
      timeout = setTimeout(() =>
          func.apply(this, args), wait
      )}
};
// promise.all 实现思路
export function promiseAll(promises, limit) {
  return new Promise((resolve, reject) => {
    const results = []
    let count = 0
    let index = 0
    while (count < promises.length) {
      const promise = promises[index]
      index++
      count++
    }
    resolve(results)
  })
}

// 冒泡排序实现思路
export function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        }
      }
    }
    return arr
};