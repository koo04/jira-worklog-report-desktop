import re
import sys

f = open("./CHANGELOG.md", "r")
i = f.read()
start_expression = r"## \[" + sys.argv[1].split('/')[2] + r"\].+?(?=\n)"
end_expression = r"---"
start = re.search(start_expression, i)
end = re.search(end_expression, i)

if start != None and end != None:
    print(f' |\n{i[start.end()+1:end.start()-1]}')
else:
    print("FAILED TO GET THE CHANGELOG")
    exit(1)
