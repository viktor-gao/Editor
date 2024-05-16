import { EditorView } from "prosemirror-view";
import { MenuGroup, MenuGroupSpec } from "./menu";
import { EditorState, PluginView } from 'prosemirror-state';

export interface ToolbarSpec {
  groups: MenuGroupSpec[]
  class?: string
}

export class Toolbar implements PluginView {
  constructor(private view: EditorView, private spec: ToolbarSpec) {
    // 定义一个 toolbar dom
    const toolbarDom = document.createElement('div');
    toolbarDom.className = spec.class ? spec.class : ''
    toolbarDom.classList.add('toolbar');

    // 将 dom 保存在 Toolbar 实例属性中
    this.dom = toolbarDom;

    // 批量创建 menuGroup
    this.groups = this.spec.groups.map(groupSpec => new MenuGroup(this.view, groupSpec))
    
    // 把 menuGroup 分别加入到 toolbar 中
    this.groups.forEach(group => {
      this.dom.appendChild(group.dom)
    })

    this.render();
  }

  // 这个 render 比较特殊，我们可以通过 view.dom 获取到 Prosemirror 编辑器挂载的 dom
  // 之后获取到它的父节点，将 toolbar 塞到 编辑器节点的前面去：这里先将 view.dom 替换成 toolbar 再把 view.dom append 上去
  // 你也可以直接用 insertBefore 之类的 api 
  render() {
    if (this.view.dom.parentNode) {
      const parentNode = this.view.dom.parentNode;
      const editorViewDom = parentNode.replaceChild(this.dom, this.view.dom);
      parentNode.appendChild(editorViewDom)
    }
  }

  groups: MenuGroup[]

  dom: HTMLElement;
  // 定义 update,主要用来批量更新 MenuGroup 中的 update
  update(view: EditorView, state: EditorState) {
    this.view = view;
    // 如果 update 时，当前 toolbar 不在页面上了，就重新生成并挂载，因为有可能传入的 state 中 plugins 有变化，此时会调用 destroy，将 toolbar 移除，这里得加回来
    if(!this.dom.parentNode) {
      this.render();
    }
    this.groups.forEach(group => {
      group.update(this.view, state);
    })
  }
  destroy() {
    this.dom.remove()
  }
}
