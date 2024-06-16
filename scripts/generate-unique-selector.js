const isUniqueSelector = selector => $(selector).length === 1

/**
 * based on StackOverflow answer https://stackoverflow.com/a/67840046/1703463
 * but heavily edited/improved:
 * - trying to generate a short selector string, so once it's unique we don't need to lengthen it further
 * - trying to avoid using "nth-child" pieces because they can lead to different elements being selected for other users
 * - avoiding using classes like `active` and `open` which are temporary and locally set
 * - allowing using attributes like `[data-actor-id='fhqwhgads']` because those are unique.  this is only allowed for
 * a limited hardcoded list of attributes (mostly data-X but also e.g. a "name" attribute for inputs).
 *
 * examples of good selectors (triple space = normal space, but more readable):
 * - #controls   li[data-control="tiles"]
 * - div#sidebar.app   i.fas.fa-cogs
 *
 * examples of bad selectors:
 * - #controls > ol.main-controls.app.control-tools > li:nth-child(3)
 * - html > body.vtt.game.system-dnd5e > section#ui-right > div#sidebar.app > nav#sidebar-tabs.tabs > a.item[data-tab="settings"] > i.fas.fa-cogs
 */
const generateQuerySelectorRecur = (elem, childStr, options) => {
  const {
    tagName,
    id,
    className,
    parentNode
  } = elem
  const { tryNthChild } = options

  if (tagName === 'HTML') return 'HTML'

  let str = tagName

  str += (id !== '') ? `#${id}` : ''
  if (isUniqueSelector(`${str}${childStr}`)) return str

  // add unique attributes such as 'data-actor-id' (for some reason normal ID is also here)
  let uniqueAttribute = undefined
  for (const attr of Object.values(elem.attributes)) {
    if (
      attr.name === 'id'
      || (attr.name.startsWith('data-') && attr.name.endsWith('-id'))
      || (attr.name === 'name' && ['input', 'button'].includes(tagName))
      || (attr.name === 'title' && className.includes('control-tool'))
      || [
        // when adding strings to this list, make sure there aren't multiple elements with identical values for them!
        'data-control', 'data-tool', 'data-tab', 'data-pack', 'data-skill', 'data-property',
        'data-sort-name', 'data-action', 'data-trait', 'data-folder', 'data-pack', 'data-src',
      ].includes(attr.name)
    ) {
      uniqueAttribute = attr.name
      if (uniqueAttribute) {
        str += `[${uniqueAttribute}="${elem.getAttribute(uniqueAttribute)}"]`
        if (isUniqueSelector(`${str}${childStr}`)) return str
      }
    }
  }

  // add class
  if (className) {
    let classes
    if (className instanceof SVGAnimatedString) { // svgs are weird for some reason
      classes = className
    } else {
      classes = className.split(/\s/)
    }
    for (let i = 0; i < classes.length; i++) {
      if (typeof classes[i] === 'string'
        && classes[i].length > 0
        && classes[i] !== 'active' && classes[i] !== 'open' // temporary state classes
        && !classes[i].includes('rhui-highlighted')
        && !classes[i].includes('hidden-to-others') // pf2e extra class for GM knowledge
      ) {
        str += `.${classes[i]}`
      }
    }
  }
  if (isUniqueSelector(`${str}${childStr}`)) return str

  if (tryNthChild && (elem.previousElementSibling || elem.nextElementSibling)) {
    let childIndex = 1
    for (let e = elem; e.previousElementSibling; e = e.previousElementSibling) {
      childIndex += 1
    }
    str += `:nth-child(${childIndex})`
    if (isUniqueSelector(`${str}${childStr}`)) return str
  }

  if (isUniqueSelector(`${str}${childStr}`)) return str
  const thisStrAsChild = ` > ${str}`
  const parentStr = generateQuerySelectorRecur(parentNode, thisStrAsChild, options)
  return `${parentStr}${thisStrAsChild}`
}

export const generateUniqueSelector = (element) => {
  let selector, shorterSelector
  // first try avoiding "nth child" since it can be different for different clients
  selector = generateQuerySelectorRecur(element, '', { tryNthChild: false })
  if (!isUniqueSelector(selector)) {
    // (but we'll use it if we have to)
    selector = generateQuerySelectorRecur(element, '', { tryNthChild: true })
  }
  // attempt to shorten it, both for nicer readability and to avoid nth-child stuff that might fail
  // in case the GM sees extra children for some element (e.g. highlighting damage in chat message card)
  const firstArrowInSelector = selector.indexOf('>')
  const lastArrowInSelector = selector.lastIndexOf('>')
  if (firstArrowInSelector !== -1) {
    shorterSelector = selector.substring(0, firstArrowInSelector)
      + ' '
      + selector.substring(lastArrowInSelector + 1)
    if (isUniqueSelector(shorterSelector)) selector = shorterSelector
  }
  // remove nth children just in case suddenly it's possible
  shorterSelector = selector.replace(/:nth-child\([0-9]+\)/g, '')
  if (isUniqueSelector(shorterSelector)) selector = shorterSelector
  console.log(`Remote Highlight UI | clicked:    ${selector}`)
  return selector
}
