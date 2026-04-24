/**
 * 复制数据文件到 dist 目录
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "data");
const targetDir = path.join(rootDir, "dist", "data");

/**
 * 递归复制目录
 * @param {string} src
 * @param {string} dest
 */
function copyRecursive(src, dest) {
  // 如果源不存在，跳过
  if (!fs.existsSync(src)) {
    console.log(`⚠️  源目录不存在: ${src}`);
    return;
  }

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    // 创建目标目录
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
      console.log(`📁 创建目录: ${dest}`);
    }

    // 递归复制子目录和文件
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyRecursive(srcPath, destPath);
    }
  } else {
    // 复制文件
    fs.copyFileSync(src, dest);
    console.log(
      `📄 复制文件: ${path.relative(rootDir, src)} → ${path.relative(rootDir, dest)}`,
    );
  }
}

// 执行复制
console.log("🚀 开始复制数据文件...\n");

try {
  copyRecursive(sourceDir, targetDir);
  console.log("\n✅ 数据文件复制完成！");
} catch (error) {
  console.error("\n❌ 复制失败:", error.message);
  process.exit(1);
}
