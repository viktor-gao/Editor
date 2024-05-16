// view.ts
import { EditorView } from 'prosemirror-view'
import { EditorState, Plugin, PluginKey } from 'prosemirror-state'
import { schema } from './schema'
// 新增以下导入
import { keymap } from 'prosemirror-keymap'
// baseKeymap 定义了对于很多基础按键按下后的功能，例如回车换行，删除键等。
import { baseKeymap } from 'prosemirror-commands'
// history 是操作历史，提供了对保存操作历史以及恢复等功能，undo，redo 函数对应为进行 undo 操作与 redo 操作，恢复历史数据
import { history, undo, redo } from 'prosemirror-history'
import { pasteImagePlugin } from './plugins/parseImage'
import { insertHeading, insertParagraph, insertBlockquote, insertDatetime, insertImage } from './utils/insertContent'
import { Toolbar } from './ui/toolbar'
import { toggleMark, updateActiveDisabled, fontSizeMark, updateSelectValue, fontFamilyMark } from './utils/setMark'
import { insertParagraphCommand, toggleBoldCmd } from './plugins/keyDownPlugin'
import { docChangedTimesPlugin } from './plugins/countChange'

export const setupEditor = (el: HTMLElement | null) => {
  if (!el) return;

  const editorRoot = document.createElement('div');
  editorRoot.id = 'editorRoot';

  // 根据 schema 定义，创建 editorState 数据实例
  const editorState = EditorState.create({
    schema,
    plugins: [
      // 这里 keymap 是个函数，运行后，会生成一个插件，插件功能即将基础按键绑定到对应的功能上，例如回车换行，删除键等。
      keymap({
        ...baseKeymap,
        Enter: insertParagraphCommand
      }),
      // 接入 history 插件，提供输入历史栈功能
      history(),
      // 将组合按键 ctrl/cmd + z, ctrl/cmd + y 分别绑定到 undo, redo 功能上
      keymap({
        "Mod-z": undo, 
        "Mod-y": redo,
        "Mod-b": toggleBoldCmd
      }),
      pasteImagePlugin,
      new Plugin({
        key: new PluginKey('toolbar'),
        view: (view) => {
          return new Toolbar(view, {
            groups: [
              {
                name: 'insert Node',
                menus: [
                  {
                    label: '插入段落',
                    category: 'button',
                    handler(props, event) {
                      insertParagraph(props.view, '新段落')
                    },
                  },
                  {
                    label: '插入一级标题',
                    category: 'button',
                    handler(props, event) {
                      insertHeading(props.view, '新标题')
                    }
                  },
                  // {
                  //   label: '添加 blockquote',
                  //   category: 'button',
                  //   handler: (props) => {
                  //     insertBlockquote(props.view)
                  //   },
                  // },
                  {
                    label: '添加 datetime',
                    category: 'button',
                    handler: (props) => {
                      insertDatetime(props.view, Date.now())
                    },
                  }
                ]
              },
              {
                name: '格式',
                menus: [
                  {
                    label: 'B',
                    category: 'button',
                    handler(props, event) {
                      toggleMark(props.view, 'bold')
                      props.view.focus()
                    },
                    update(view, state, menuDom) {
                      updateActiveDisabled(view, 'bold', menuDom)
                    },
                  },
                  {
                    label: 'I',
                    category: 'button',
                    handler(props, event) {
                      toggleMark(props.view, 'italic')
                      props.view.focus()
                    },
                    update(view, state, menuDom) {
                      updateActiveDisabled(view, 'italic', menuDom)
                    }
                  },
                  {
                    label: 'S',
                    category: 'button',
                    handler(props, event) {
                      toggleMark(props.view, 'strike')
                      props.view.focus()
                    },
                    update(view, state, menuDom) {
                      updateActiveDisabled(view, 'strike', menuDom)
                    }
                  },
                  {
                    label: 'U',
                    category: 'button',
                    handler(props, event) {
                      toggleMark(props.view, 'underline')
                      props.view.focus()
                    },
                    update(view, state, menuDom) {
                      updateActiveDisabled(view, 'underline', menuDom)
                    }
                  },
                  {
                    label: '字体大小',
                    category: 'select',
                    item: ['1', '2', '3', '4', '5'],
                    handler(props, event) {
                      fontSizeMark(props.view, 'fontSize', event.target.value)
                      props.view.focus()
                    },
                    update(view, state, menuDom) {
                      updateSelectValue(view, 'fontSize', menuDom)
                    }  
                  },
                ]
              }
            ]
          })
        }
      }),
      docChangedTimesPlugin()
    ]
  })

  // 创建编辑器视图实例，并挂在到 el 上
  const editorView = new EditorView(editorRoot, {
    state: editorState,
    // 光标有动静也能触发这个 tr
    dispatchTransaction(tr) {
      let newState = editorView.state.apply(tr);
      editorView.updateState(newState);
      // toolbar.update(editorView, editorView.state)
    }
  })


  const fragment = document.createDocumentFragment()
  fragment.appendChild(editorRoot)

  el.appendChild(fragment)

  window.editorView = editorView
}

