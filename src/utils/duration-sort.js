function durationToSeconds(duration) {
  if (/\d+ms$/.test(duration)) {
    return parseInt(duration, 10) / 1000
  }

  // Complicated workaround for parseInt '0.002s' => 0
  duration = duration.replace(/s|ms/, '') * 1000
  return parseInt(duration, 10) / 1000
}

module.exports = (a, b) => {
  const A = durationToSeconds(a)
  const B = durationToSeconds(b)

  if (A === B) {
    return a.endsWith('ms') ? -1 : 1
  }

  return A - B
}
