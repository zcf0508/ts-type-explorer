type ExpandObject<
  T extends object,
  Key extends string = 'key',
  Value extends string = 'value',
  S extends keyof T = keyof T,
> = S extends string
  ? {
    [key in Key | Value]: key extends Key ? S : T[S]
  }
  : never;

export function pairs<T extends Record<any, any>>(obj: T): ExpandObject<T>[] {
  return Object.keys(obj)
    .reduce(
      (prev: any, curr: any) => [
        { key: curr, value: obj[curr] } as any,
        ...prev,
      ],
      [] as ExpandObject<T>[],
    )
    .reverse();
}

export function mapObject<O extends Record<any, any>, R>(
  obj: O,
  func: (key: ExpandObject<O>) => R,
): { [K in keyof O]: R } {
  const res = {} as { [K in keyof O]: R };

  pairs(obj).forEach((v) => {
    res[v.key as keyof typeof res] = func(v);
  });

  return res;
}
