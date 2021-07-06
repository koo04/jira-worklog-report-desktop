import re
import sys

f = open("./CHANGELOG.md", "r")
i = f.read()
start_expression = r"## \[" + sys.argv[1] + r"\].+?(?=\n)"
end_expression = r"---"
start = re.search(start_expression, i)
end = re.search(end_expression, i)

print(start.end(), end.start())

if start != None and end != None:
    print(i[start.end()+1:end.start()-1])
