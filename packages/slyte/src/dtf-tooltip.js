import { prop } from "@slyte/core";
import { Component } from "@slyte/component";

/**
 * dtf-tooltip — DTF Slyte wrapper
 * Tooltip wrapper. content is the tip text; trigger is the wrapped element.
 *
 * Usage:
 *   <dtf-tooltip lt-prop-variant="filled" lt-prop-color-role="brand">
 *     <template is="registerYield" yield-name="yield">Label</template>
 *   </dtf-tooltip>
 */
class DtfTooltip extends Component {
  data() {
    return {
      content: prop("string", { default: "" }),
      placement: prop("string", { default: "top" }),
    };
  }

}

export { DtfTooltip };
