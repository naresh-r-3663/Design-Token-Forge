import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-textarea — DTF Slyte wrapper
 * Multi-line text input.
 *
 * Usage:
 *   <dtf-textarea lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-textarea>
 */
class DtfTextarea extends Component {
  data() {
    return {
      size: prop("string", { default: "base" }),
      variant: prop("string", { default: "outlined" }),
      label: prop("string", { default: "" }),
      placeholder: prop("string", { default: "" }),
      value: prop("string", { default: "" }),
      disabled: prop("boolean", { default: false }),
      error: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".textarea");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
    el.toggleAttribute("data-error", this.getData("error"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".textarea");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
      errorChanged: function() {
        var el = this.$node.querySelector(".textarea");
        if (el) el.toggleAttribute("data-error", this.getData("error"));
      }.observes("error"),
    };
  }
}

export { DtfTextarea };
