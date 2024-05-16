import { schema } from './../schema';
import { MarkType } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { TextSelection } from "prosemirror-state";
/**
 * 设置 mark
 * 
 * @param view 
 * @param markType 
 * @param attrs 
 */
function setMark(view: EditorView, markType: MarkType | string, attrs: Attrs | null = null) {
  const { schema, selection, tr } = view.state;
  const { $from, $to, empty } = selection;

  const realMarkType = getMarkType(markType, schema);
  const mark = realMarkType.create(attrs);
  // 根据 schema.mark 创建 mark，因为 markType 可以传入字符串，如果通过 MarkType，我们还需要先根据 shema.marks[markType] 先获取真正的 markType

  // 光标状态，如果 storedMarks 里没有 当前 mark，就把当前 mark 加进去
  if (empty) {
    if (!realMarkType.isInSet(tr.storedMarks || $from.marks())) {
      tr.addStoredMark(mark)
    }
  } else {
    // 否则再执行之前的逻辑
    tr.addMark($from.pos, $to.pos, mark);
  }
  
  // 派发 tr 触发更新
  view.dispatch(tr);
  
  return true
}

/**
 * 取消 mark
 * 
 * @param view 
 * @param markType 
 */
function unsetMark(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;
  const { $from, $to, empty } = selection;
  
  const type = getMarkType(markType, schema);

  // 如果处于光标模式，查看是否有 StoredMark，有的话移除（此时如果是 $from.marks() 中有，此 api 也能移除）
  if (empty) {
    if (type.isInSet(tr.storedMarks || $from.marks())) {
      tr.removeStoredMark(type)
    }
  } else {
    tr.removeMark($from.pos, $to.pos, type);
  }
  
  view.dispatch(tr)

  return true;
}

// 将获取 markType 的功能封装为函数方便调用
function getMarkType(markType: MarkType | string, schema: Schema) {
  return typeof markType === 'string' ? schema.marks[markType] : markType;
}

// 判断当前 selection 是否是 文本选区，prosemirror 中除了文本选区，还有 Node 选区 NodeSelection，即当前选中的是某个 Node 节点而不是文本
function isTextSelection(selection: unknown): selection is TextSelection {
  return selection instanceof TextSelection;
}

/**
 * 选区内所有的内容都被设置了 mark，那就是 active
 * 
 * @param view 
 * @param markType 
 */
export function isMarkActive(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;
  // 暂时规定：如果不是文本选区，就不能设置 mark
  if (!isTextSelection(selection)) {
    return false;
  }

  const { $from, $to, empty } = selection;  

  const realMarkType = getMarkType(markType, schema);

  let isActive = true;
  // 增加 光标情况下，判断当前是否处于 markType 下
  if(empty) {
    if(!realMarkType.isInSet(tr.storedMarks || $from.marks())) {
      isActive = false
    }
  } else {
    tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (!isActive) return false;
      // 这里之所以是 node.isInline，是因为我们之前讨论过，mark 都是设置在行内内容上的
      if (node.isInline) {
        // markType.isInset(marks[]) 可以判断当前 marks 中是否包含当前 markType 类型的 mark
        const mark = realMarkType.isInSet(node.marks)
        if (!mark) {
          // 如果 有任意一个 不包含，则设置 active 为 false，即当前可以设置 mark
          isActive = false;
        }
      }
    })
  }
  

  return isActive;
}

/**
 * 当前是否能设置某个 mark
 * 
 * @param view 
 * @param markType 
 * @returns 
 */
export function canSetMark(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;

  // 非文本选区，不可以设置 mark
  if(!isTextSelection(selection)) return false

  const { $cursor, empty, ranges } = selection
  const realMarkType = getMarkType(markType, schema);
  let canSet = false
  // 先处理empty
  if(empty) {
    if($cursor && $cursor.parent.type.allowsMarkType(realMarkType)) {
      canSet = true
    }
  } else {
    for (let i = 0; !canSet && i < ranges.length; i++) {
      const { $from, $to } = ranges[i];
      tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
        // 只要有能设置的文本，立刻停止遍历
        // return false 表示停止遍历
        if (canSet) return false;
        if (node.inlineContent && node.type.allowsMarkType(realMarkType)) {
          canSet = true;
        }
      })
    }
  }
  return canSet
}

/**
 * toggle mark
 * 
 * @param view 
 * @param markType 
 * @returns 
 */
export function toggleMark(view: EditorView, markType: MarkType | string) {
  if(isMarkActive(view, markType)) {
    return unsetMark(view, markType)
  } else {
    return setMark(view, markType);
  }
}

// 处理字体大小下拉框
export function fontSizeMark(view: EditorView, markType: MarkType | string, size = '1') {
  const { tr, selection } = view.state;
  const { $from, $to, empty } = selection
  const realMarkType = getMarkType(markType, schema);
  const mark = realMarkType.create({
    size
  })
  if(empty) {
    tr.addStoredMark(mark)
    // if (!realMarkType.isInSet(tr.storedMarks || $from.marks())) {
      
    // }
  } else {
    tr.addMark($from.pos, $to.pos, mark)
  }

  view.dispatch(tr)
  return true
}


// 根据光标和selection的变化，控制按钮的回显和禁用
export function updateActiveDisabled(view: EditorView, markType: MarkType | string, menuDom: HTMLElement) {
  const isActive = isMarkActive(view, markType)
  const disabled = !canSetMark(view, markType)
  if(disabled && !menuDom.getAttribute('disabled')) {
    menuDom.setAttribute('disabled', 'true')
    return;
  }
  if(!disabled && menuDom.getAttribute('disabled')) {
    menuDom.removeAttribute('disabled')
  }
  if(isActive && !menuDom.classList.contains('is-active')) {
    menuDom.classList.add('is-active')
  }
  if(!isActive && menuDom.classList.contains('is-active')) {
    menuDom.classList.remove('is-active')
  }
}

// 处理字体family下拉框
export function fontFamilyMark(view: EditorView, markType: MarkType | string, family: string) {
  const { tr, selection } = view.state;
  const { $from, $to, empty } = selection
  const realMarkType = getMarkType(markType, schema);
  const mark = realMarkType.create({
    family
  })
  if(empty) {
    tr.addStoredMark(mark)
    // if (!realMarkType.isInSet(tr.storedMarks || $from.marks())) {
      
    // }
  } else {
    tr.addMark($from.pos, $to.pos, mark)
  }

  view.dispatch(tr)
  return true
}


// 获取下拉框对应的值
export function getSelectValue(view: EditorView, markType: MarkType | string) {
  const { schema, selection, tr } = view.state;

  const { $from, $to, empty } = selection
  const realMarkType = getMarkType(markType, schema); 
  if(empty) {
    if(realMarkType.isInSet(tr.storedMarks || $from.marks())) {
      return tr.storedMarks?.find(mark => mark.type === realMarkType)?.attrs?.size || $from.marks().find(mark => mark.type === realMarkType)?.attrs?.size
    }
  } else {
    // 如果包含了别的，就返回 false,如果没包含别的，就返回具体的值
    tr.doc.nodesBetween($from.pos, $to.pos, (node) => {
      const mark = realMarkType.isInSet(node.marks)
      if(!mark) {
        return false
      }
    })
    return $from.marks().find(mark => mark.type === realMarkType)?.attrs?.size;
  }
}

export function updateSelectValue(view: EditorView, markType: MarkType | string, menuDom: HTMLElement) {
  const isActive = isMarkActive(view, markType)
  if(isActive) {
    // menuDom.value = 
    if(getSelectValue(view, markType)) {
      (menuDom as HTMLSelectElement).value = getSelectValue(view, markType)
    }
    console.log('下拉框的值', getSelectValue(view, markType))
  } else {
    (menuDom as HTMLSelectElement).value = '1'
  }
}