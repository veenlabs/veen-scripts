import Defuddle from 'defuddle'
import { Readability } from '@mozilla/readability'

console.log("Script loaded....")
console.log("Line 2")
console.log("Line 3")

function parseHtml(html){
    const parser = new DOMParser()
    const dom = parser.parseFromString(html, 'text/html')
    var article1 = new Readability(dom).parse()
    const article2 = new Defuddle(dom).parse()
    return {article1, article2}
}
window.parseHtml = parseHtml