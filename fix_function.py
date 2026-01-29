import re

file_path = r"e:\Project\robot_web\src\views\NavigationManage.vue"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the pattern to match the clearGridEdit function
# We'll match from the function start to its closing brace
pattern = r'(// 清除编辑\r?\nconst clearGridEdit = \(\) => \{\r?\n  const canvas = gridMapCanvas\.value\r?\n  const ctx = canvas\?\.getContext\(\'2d\'\)\r?\n  if \(!canvas \|\| !ctx \|\| !missionGridImageData\) return\r?\n  \r?\n)([\s\S]*?)(\r?\n\})'

# Define the replacement - keep the function signature and replace the body
replacement = r'\1  // 恢复原始地图数据\r\n  ctx.putImageData(missionGridImageData, 0, 0)\r\n  gridImageData = null\r\n  editHistory.value = []\r\n}'

# Perform the replacement
new_content = re.sub(pattern, replacement, content)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Function updated successfully!")
