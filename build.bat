mkdir "client/bin"
node_modules/.bin/duo --stdout client/src/main.js > client/bin/main.js
node_modules/.bin/duo --stdout client/src/main.css > client/bin/style.css
