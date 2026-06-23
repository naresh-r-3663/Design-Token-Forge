import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-toggle — DTF Slyte wrapper
 * Toggle switch. checked/disabled synced to input element.
 *
 * Usage:
 *   <dtf-toggle lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-toggle>
 */
class DtfToggle extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      label: prop("string", { default: "" }),
      checked: prop("boolean", { default: false }),
      disabled: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".switch");
    if (!el) return;
    el.toggleAttribute("data-disabled", this.getData("disabled"));
  }

  didConnect() {
    this._syncBoolAttrs();
    var input = this.$node.querySelector("input");
    if (input) {
      input.checked = this.getData("checked");
      input.disabled = this.getData("disabled");
    }
  }

  static actions() {
    return {
      onChange: function(e) {
        var val = e.target.checked;
        this.setData('checked', val);
        this.throwEvent('change', val);
      }
    };
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".switch");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
      checkedChanged: function() {
        var input = this.$node.querySelector("input");
        if (input) input.checked = this.getData("checked");
      }.observes("checked"),
      disabledChanged: function() {
        var input = this.$node.querySelector("input");
        if (input) input.disabled = this.getData("disabled");
      }.observes("disabled"),
    };
  }
}

export { DtfToggle };
