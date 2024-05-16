// crel 就是个 createElement 的缩写，用来创建 dom 元素的，感兴趣的可以看看源码就几十行
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
// 抽象 menu 的定义，不要每次都定义很多 html
/**
 * const btn = document.createElement('button')
 * btn.classList.add('is-active') // 当前 btn 激活
 * btn.classList.add('is-disabled') // 当前 btn 禁用
 * btn.onClick = fn // 点击 btn 后的效果
 * 
 * update btn style
 */

export interface MenuItemSpec {
  class?: string;
  label: string;
  // 下拉框才有item
  item?: Array<string>;
  category: string
  handler: (
    props: {
      view: EditorView;
      state: EditorState;
      tr: Transaction;
      dispatch: EditorView['dispatch'];
    }, 
    event: Event
  ) => void;
  update?: (view: EditorView, state: EditorState, menu: HTMLElement) => void;
}

export class MenuItem {
  constructor(private view: EditorView, private spec: MenuItemSpec) {
    // 分为下拉框和button
    // 通过条件判断来确认是下拉框还是按钮
    // 创建 button
    const { category } = spec;
    console.log(category)
    if(category === 'button') {
      const btn = document.createElement('button');
      btn.className = spec.class ? spec.class : '';
      btn.addEventListener('click', (event) => {
        spec.handler({
          view: this.view,
          state: this.view.state,
          dispatch: this.view.dispatch,
          tr: this.view.state.tr
        }, event)
      
      })
  
      btn.classList.add('menu-item')
  
      btn.innerText = spec.label;
  
      // 将 btn 绑定在当前组件上
      this.dom = btn;
    } else {
      const select = document.createElement('select');
      select.className = spec.class ? spec.class : '';
      const options = spec.item.map(item => {
        const option = document.createElement('option');
        option.innerText = item;
        option.value = item;
        return option;
      })
      select.append(...options)
      select.addEventListener('change', (event) => {
        spec.handler({
          view: this.view,
          state: this.view.state,
          dispatch: this.view.dispatch,
          tr: this.view.state.tr
        }, event)
      })
      select.classList.add('menu-select')
      this.dom = select
    }
    
  }

  dom: HTMLElement;
  
  // 定义一个 update 更新方法，在编辑器有更新的时候就调用
  update(view: EditorView, state: EditorState) {
    this.view = view;
    this.spec.update?.(view, state, this.dom)
  }
}
