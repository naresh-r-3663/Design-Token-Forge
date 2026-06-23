import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-divider — DTF Slyte wrapper
 * Horizontal or vertical divider. Pass label as yield for a labeled divider.
 *
 * Usage:
 *   <dtf-divider lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-divider>
 */
class DtfDivider extends Component {
  data() {
    return {
      variant: prop("string", { default: "solid" }),
      orientation: prop("string", { default: "horizontal" }),
      size: prop("string", { default: "base" }),
    };
  }

}

export { DtfDivider };
