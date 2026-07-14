export function formatValue(value: number, unit: string) {
  const n = value.toLocaleString("es-VE");
  return unit === "$" ? `$${n}` : n;
}
