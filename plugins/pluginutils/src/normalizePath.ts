// import { win32, posix } from 'path-browserify';

import type { NormalizePath } from '../types';

const normalizePath: NormalizePath = function normalizePath(filename: string) {
  return filename.split("\\").join("/");
};

export { normalizePath as default };
