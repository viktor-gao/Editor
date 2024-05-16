import { Plugin, PluginKey } from 'prosemirror-state';

const pasteImagePluginKey = new PluginKey('pasteImage');

export const pasteImagePlugin = new Plugin({
  key: pasteImagePluginKey,
  props: {
    handlePaste(view, event, slice) {
      console.log('进入了此插件')
      if (!event.clipboardData || !event.clipboardData.items) return false;

      const items = event.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') === 0) {
          event.preventDefault();

          const reader = new FileReader();
          reader.onload = () => {
            const src = reader.result as string; 
            const tempImg = new Image();
            tempImg.onload = () => {
              let width = tempImg.naturalWidth;
              let height = tempImg.naturalHeight;
              // 限制图片的最大宽度
              const maxWidth = 300;
              if (width > maxWidth) {
                const scaleFactor = maxWidth / width;
                width = maxWidth;
                height = height * scaleFactor;
              }

              console.log(`Image dimensions: ${width}x${height}`);
              const { state, dispatch } = view;
              const { schema } = state;
              const image = schema.nodes.image.create({ src, width, height });
              const tr = state.tr.replaceSelectionWith(image);
              dispatch(tr);
            }
            tempImg.src = src;
            
          };
          reader.readAsDataURL(item.getAsFile());

          return true;
        }
      }
      return false;
    },
  },
});