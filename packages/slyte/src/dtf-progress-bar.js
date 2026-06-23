import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-progress-bar — DTF Slyte wrapper
 * Horizontal progress bar. value 0–100. Use buffer for buffering indicator.
 *
 * Usage:
 *   <dtf-progress-bar lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-progress-bar>
 */
class DtfProgressBar extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      size: prop("string", { default: "base" }),
      label: prop("string", { default: "Progress" }),
      indeterminate: prop("boolean", { default: false }),
      value: prop("number", { default: 0 }),
      buffer: prop("number", { default: 0 }),
    };
  }

}

export { DtfProgressBar };
