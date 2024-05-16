import { Command } from "prosemirror-state";
import { toggleMark } from '../utils/setMark'

export const insertParagraphCommand: Command = (state, dispatch) => {
  const { tr, schema } = state
  const { block_tile, paragraph } = schema.nodes;

  const newLine = block_tile.create({}, paragraph.create())
  // 监听到了回车键
  if(dispatch) {
    tr.replaceSelectionWith(newLine)
    tr.scrollIntoView()
    dispatch(tr)
    return true
  }
  return false
}

export const toggleBoldCmd: Command = (state, dispatch, view) => {
  if(view) {
    return toggleMark(view, 'bold')
  }
  return false
}