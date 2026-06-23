import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-file-upload — DTF Slyte wrapper
 * File upload. on-files fires with a FileList object.
 *
 * Usage:
 *   <dtf-file-upload lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-file-upload>
 */
class DtfFileUpload extends Component {
  data() {
    return {
      size: prop("string", { default: "base" }),
      mode: prop("string", { default: "button" }),
      accept: prop("string", { default: "*" }),
      multiple: prop("boolean", { default: false }),
      disabled: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".file-upload");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static actions() {
    return {
      onFiles: function(e) {
        this.throwEvent('files', e.target.files);
      }
    };
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".file-upload");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
    };
  }
}

export { DtfFileUpload };
