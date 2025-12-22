import DiscourseRoute from "discourse/routes/discourse";
import ajax from "discourse/lib/ajax";

export default class AdminPluginsMassAnonymizeRoute extends DiscourseRoute {
  model() {
    // return ajax("/admin/plugins/mass-anonymize/admin");
    return { something: "Yuh" };
  }
};
