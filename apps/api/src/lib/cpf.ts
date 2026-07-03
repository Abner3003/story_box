export function isValidCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const digits = cpf.split('').map(Number)

  const calcCheckDigit = (length: number): number => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10]
}
