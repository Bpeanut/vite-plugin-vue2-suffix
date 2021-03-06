import fs from "fs";
import path from "path";

// 相对路径转换成绝对路径的【前缀】
const fullPathPrefix = (m: string, id: string) => {
  // 处理import时的路径引入问题
  /**
   *  './component/xxx'
   *  '../layout/xxx'
   *  '@/component/xxx'
   *  './component/foo-xxx' // 命名不一致问题 component: { xxx }
   */

  if (m.includes("@")) {
    return process.cwd() + "/src";
  } else {
    return path.parse(id).dir; // 返回当前文件下路径
  }
};

/**
 *
 * @param {String} filePathRaw 文件的绝对路径
 * @param {String} code 当前文件的代码
 */

export function handleImportVerifyPath(code: string) {
  return (filePathRaw: string) => {
    if (!code) return;
    // 如果能判断到有读写权限，取得地址 / 的最后一个单词
    const fileReg = `/${filePathRaw.split("/").pop()}`;
    console.log("handleImport -> fileReg", fileReg);
    if (filePathRaw.includes(".vue")) return;
    try {
      // 检测文件读写权限
      fs.accessSync(`${filePathRaw}.vue`, fs.constants.R_OK);

      // 并加上后缀
      code = code.replace(fileReg, `${fileReg}.vue`);
      console.log("handleImportVerifyPath -> code", code);
    } catch (error) {
      // 如果判断到没有读写权限，则/index.vue
      code = code.replace(fileReg, `${fileReg}/index.vue`);
    }

    // return _code
    if (code.includes("BackTop")) {
      console.log("handleImportVerifyPath inside", code);
    }
  };
}

/**
 *
 * @param {string} code 返回识别*.vue文件里 component {} 里面的值
 */
export function handleGetCompoents(code: string) {
  // 匹配components: { xxx, xxx}, 匹配结果为如下：
  /**
   * {
   *  xxx1,
   *  xxx2,
   *  xxx3
   *  }
   */
  const regExp = /(?<=components:(\s)*)({(?:[^}]+)})/g;
  let regComponent: string[] | RegExpMatchArray | null = code.match(regExp);

  // 去掉 “// ” 的注释
  const regComponentStr = regComponent && regComponent[0].replace(/\/\/(.*)/g, "");

  // 通过 “,” 分隔开componet元素
  regComponent = (regComponentStr && regComponentStr.split(",")) as string[];

  let componentList =
    regComponent &&
    regComponent.map((w) =>
      w
        .replace(/\n*/g, "")
        .replace(/\s*/g, "")
        .replace(/{/, "")
        .replace(/}/, "")
    );

  return componentList;
}

// 处理 *.vue 里面的 import 语句
/**
 *
 * @param {Array} componentNameArray 组件名数组
 */
export function handleGetImportUrl(componentNameArray: Array<string>, code: string, id: string) {
  if (!componentNameArray) return {};
  const compoentMatchArr = componentNameArray.join("|");
  const regExp = new RegExp(
    `(?<=(import\\s(${compoentMatchArr})\\sfrom\\s))(\\'(.*)\\')`,
    "g"
  );

  let regComponent =
    (code.match(regExp) && code.match(regExp)!.map((m) => m.replace(/\'/g, ""))) as string[];

  return {
    pathList: handleFullPath(regComponent, id),
    componentShortPath: regComponent,
  };
}

/**
 * 把相对路径都处理成绝对路径
 * @param {Array} regComponent 通过用正则match匹配后的数组
 */
export function handleFullPath(regComponent: RegExpMatchArray, id: string) {
  return (
    regComponent &&
    regComponent.map((m) => {
      if (m.includes("@")) {
        let mAfter = m.replace("@/", "");
        return path.join(fullPathPrefix(m, id), mAfter);
      } else {
        return path.resolve(fullPathPrefix(m, id), m);
      }
    })
  );
}
