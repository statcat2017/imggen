export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  // TODO: typed localStorage hook with JSON serialization
  void key;
  void initial;
  return [initial, () => {}];
}
