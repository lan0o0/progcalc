#!/bin/bash
# 后处理 dist/index.html:
# 1. 把 <script type="module" crossorigin> 改成 <script>
#    (file:// 协议下不能用 module script)
set -e

HTML=/workspace/dist/index.html

echo "=== post-build: 处理 $HTML ==="

# 1. 去掉 type="module" crossorigin
sed -i 's|<script type="module" crossorigin>|<script>|g' "$HTML"

# 2. 不再插入诊断脚本(main.tsx 里已经处理了)

echo "=== 验证 ==="
grep -oE "<script[^>]*>" "$HTML" | head -5
ls -lh "$HTML"
