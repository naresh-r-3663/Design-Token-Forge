import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-radio — DTF Slyte wrapper
 * Radio button. Use name prop for grouping.
 *
 * Usage:
 *   <dtf-radio lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-radio>
 */
class DtfRadio extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      name: prop("string", { default: "" }),
      value: prop("string", { default: "" }),
      label: prop("string", { default: "" }),
      checked: prop("boolean", { default: false }),
      disabled: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".radio");
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
        this.setData('checked', e.target.checked);
        this.throwEvent('change', this.getData('value'));
      }
    };
  }

  static observers() {
    return {
      disabledChanged: function() {
        var el = this.$node.querySelector(".radio");
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

export { DtfRadio };
