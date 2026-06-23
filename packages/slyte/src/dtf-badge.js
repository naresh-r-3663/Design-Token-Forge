import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-badge — DTF Slyte wrapper
 * Status badge. Use colorRole for semantic color.
 *
 * Usage:
 *   <dtf-badge lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-badge>
 */
class DtfBadge extends Component {
  data() {
    return {
      colorRole: prop("string", { default: "brand" }),
      variant: prop("string", { default: "filled" }),
      size: prop("string", { default: "base" }),
    };
  }

}

export { DtfBadge };
