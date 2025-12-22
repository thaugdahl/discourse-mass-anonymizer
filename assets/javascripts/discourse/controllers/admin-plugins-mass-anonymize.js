import Controller from "@ember/controller";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";

import { ajax } from "discourse/lib/ajax"

export default class AdminPluginsMassAnonymizeController extends Controller {
  @tracked eligibleUsers = [];

  @tracked isLoading = false;

  usersFetched = false;



  @action getUsers() {
    if ( this.usersFetched ) {
      return;
    }

    this.isLoading = true;
    const res = ajax("/mass-anonymize/admin.json");

    res.then(
      (res) => {
        const users = res["users"];

        this.eligibleUsers = users.map((user) => {
          const then = new Date(user.last_seen_at)
          const now = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;

          user.days_since = Math.floor((now - then) / msPerDay).toString() + " days";
          return user;
        });
      }).catch((err) => console.error(err)).finally(() => {this.isLoading = false;});


    console.log(res);

    console.log("Fetching users");
    this.usersFetched = true;

    this.eligibleUsers = [{name: "tor"}, ...this.eligibleUsers];
    this.tentacleVisible = true;


  }
}
