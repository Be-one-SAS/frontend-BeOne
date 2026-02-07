/**
 * 
 * @param clave 
 * @param data 
 * @returns el valor de la clave que recibe por parametro
 */
export function searchByKey<T = any>(clave: string, data: Record<string, T>): T | undefined {
  return data[clave];
}
