import { Schema } from "prosemirror-model";

export const schema = new Schema({
  nodes: {
    // 根节点
    doc: {
      content: 'tile+'
    },
    // 自定义节点
    block_tile: {
      content: 'block+',
      group: 'tile',
      inline: false,
      draggable: true,
      toDOM: () => {
        return ['div', { class: 'block_tile' }, 0]
      },
      parseDOM: [
        {
          tag: 'div.block_tile',
        }
      ]
    },
    // 段落
    paragraph: {
      content: 'inline*',
      group: 'block',
      toDOM: () => {
        return ['p', 0]
      },
      parseDOM: [{ tag: 'p' }]
    },
    // 标题
    heading: {
      attrs: {
        level: {
          default: 1
        }
      },
      marks: '',
      content: 'inline*',
      group: 'block',
      // 这个不加会有 h2标签不显示的bug
      defining: true,
      // 这个属性也有用
      // isolating: true,
      toDOM(node) {
        const tag = `h${node.attrs.level}`
        return [tag, 0]
      },
      parseDOM: [
        {tag: "h1", attrs: {level: 1}},
        {tag: "h2", attrs: {level: 2}},
        {tag: "h3", attrs: {level: 3}},
        {tag: "h4", attrs: {level: 4}},
        {tag: "h5", attrs: {level: 5}},
        {tag: "h6", attrs: {level: 6}}
      ],
    },
    // 文本
    text: {
      group: 'inline'
    },
    // blockquote: {
    //   content: 'paragraph+',
    //   group: 'block',
    //   defining: true,
    //   toDOM: () => {
    //     return ['blockquote', 0]
    //   },
    //   parseDOM: [
    //     {tag: 'blockquote'}
    //   ]
    // },
    datetime: {
      group: 'inline',
      inline: true,
      atom: true,
      attrs: {
        timestamp: {
          default: null
        }
      },
      toDOM: (node) => {
        // 自定义 dom 结构
        const dom = document.createElement('span');
        dom.classList.add('datetime')
        dom.dataset.timestamp = node.attrs.timestamp;
        console.log('node.attrs',node.attrs)

        let time = ''
        if (node.attrs.timestamp) {
          const date = new Date(node.attrs.timestamp)
          time = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
        }
        const label = document.createElement('label');
        label.innerText = '请选择时间';

        const input = document.createElement('input');
        input.type="date";
        input.value = time;

        input.addEventListener('input', (event) => {
          dom.dataset.timestamp = new Date((event.target as HTMLInputElement).value).getTime().toString()
        })

        dom.appendChild(label)
        dom.appendChild(input)
        // 返回 dom
        return dom;
      },
      parseDOM: [
        {
          tag: 'span.datetime',
          getAttrs(htmlNode) {
            if (typeof htmlNode !== 'string') {
              const timestamp = htmlNode.dataset.timestamp;
              return {
                timestamp: timestamp ? Number(timestamp) : null
              }
            };
            return {
              timestamp: null
            }
          }
        }
      ]
    },
    image: {
      group: 'inline',
      inline: true,
      atom: true,
      attrs: {
        src: {},
        alt: { default: null },
        title: { default: null },
        width: { default: 200 },
        height: { default: 200 }
      },
      toDOM(node) {
        const { src, alt, title, width, height } = node.attrs;
        return ['img', { src, alt, title, width, height }];
      },
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs(dom) {
            return {
              src: dom.getAttribute('src'),
              title: dom.getAttribute('title'),
              alt: dom.getAttribute('alt'),
              width: dom.getAttribute('width'),
              height: dom.getAttribute('height')
            };
          },
        },
      ],
    }
  },
  marks: {
    bold: {
      toDOM: () => {
        return ['strong', 0]
      },
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b', getAttrs: (domNode) => (domNode as HTMLElement).style.fontWeight !== 'normal' && null },
        { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2})$/.test(value as string) && null }
      ]
    },
    italic: {
      toDOM: () => {
        return ['em', 0]
      },
      parseDOM: [
        { tag: 'em' },
        { tag: 'i', getAttrs: (domNode) => (domNode as HTMLElement).style.fontStyle !== 'normal' && null},
        { style: 'font-style=italic' },
      ]
    },
    // 删除线
    strike: {
      toDOM: () => {
        return ['s', 0]
      },
      parseDOM: [
        { tag: 's' },
        { tag: 'del', getAttrs: (domNode) => (domNode as HTMLElement).style.textDecoration !== 'line-through' && null },
        { style: 'text-decoration', getAttrs: (value) => value === 'line-through' && null }
      ]
    },
    // 下划线 u
    underline: {
      toDOM: () => {
        return ['u', 0]
      },
      parseDOM: [
        { tag: 'u' },
        { style: 'text-decoration', getAttrs: (value) => value === 'underline' && null }
      ]
    },
    link: {
      attrs: {
        href: {
          default: null
        },
        ref: {
          default: 'noopener noreferrer nofollow'
        },
        target: {
          default: '_blank'
        },
      },
      toDOM: (mark) => {
        const { href, ref, target } = mark.attrs;
        return ['a', { href, ref, target  }, 0]
      },
      parseDOM: [
        {
          tag: 'a[href]:not([href *= "javascript:" i])'
        }
      ]
    },
    fontSize: {
      attrs: {
        size: {
          default: '1'
        }
      },
      toDOM: (mark) => {
        return ['span', { style: `font-size: ${mark.attrs.size}em` }, 0]
      },
      parseDOM: [
        {
          tag: 'span'
        }
      ]
    },
  },
  topNode: 'doc'
})
