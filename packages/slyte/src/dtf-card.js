import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-card — DTF Slyte wrapper
 * Card container. interactive adds hover/focus states.
 *
 * Usage:
 *   <dtf-card lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-card>
 */
class DtfCard extends Component {
  data() {
    return {
      variant: prop("string", { default: "flat" }),
      size: prop("string", { default: "base" }),
      rounded: prop("boolean", { default: false }),
      interactive: prop("boolean", { default: false }),
      disabled: prop("boolean", { default: false }),
    };
  }

  _syncBoolAttrs() {
    var el = this.$node.querySelector(".card");
    if (!el) return;
    el.toggleAttribute("data-rounded", this.getData("rounded"));
    el.toggleAttribute("data-disabled", this.getData("disabled"));
    el.toggleAttribute("data-interactive", this.getData("interactive"));
  }

  didConnect() {
    this._syncBoolAttrs();
  }

  static observers() {
    return {
      roundedChanged: function() {
        var el = this.$node.querySelector(".card");
        if (el) el.toggleAttribute("data-rounded", this.getData("rounded"));
      }.observes("rounded"),
      disabledChanged: function() {
        var el = this.$node.querySelector(".card");
        if (el) el.toggleAttribute("data-disabled", this.getData("disabled"));
      }.observes("disabled"),
      interactiveChanged: function() {
        var el = this.$node.querySelector(".card");
        if (el) el.toggleAttribute("data-interactive", this.getData("interactive"));
      }.observes("interactive"),
    };
  }
}

export { DtfCard };
