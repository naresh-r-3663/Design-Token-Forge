import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-progress-ring — DTF Slyte wrapper
 * Circular progress ring. CSS --progress var is set via didConnect observer.
 *
 * Usage:
 *   <dtf-progress-ring lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-progress-ring>
 */
class DtfProgressRing extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      label: prop("string", { default: "Progress" }),
      indeterminate: prop("boolean", { default: false }),
      value: prop("number", { default: 0 }),
    };
  }

  _syncProgress() {
    var el = this.$node.querySelector(".progress-ring");
    if (el) {
      el.style.setProperty("--progress", this.getData("value") + "%");
      el.toggleAttribute("data-indeterminate", this.getData("indeterminate"));
    }
  }

  didConnect() {
    this._syncProgress();
  }

  static observers() {
    return {
      valueChanged: function() {
        this._syncProgress();
      }.observes("value"),
      indeterminateChanged: function() {
        var el = this.$node.querySelector(".progress-ring");
        if (el) el.toggleAttribute("data-indeterminate", this.getData("indeterminate"));
      }.observes("indeterminate"),
    };
  }
}

export { DtfProgressRing };
