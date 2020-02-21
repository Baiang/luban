import { hot } from "react-hot-loader/root";
import React, { FunctionComponent } from "react";

import logo from "../assets/logo.svg";

import styles from "./App.less";

const App: FunctionComponent = () => (
  <div className={styles.App}>
    <header className={styles["App-header"]}>
      <img src={logo} className={styles["App-logo"]} alt="logo" />
      <p>
        <span role="img" aria-label="keyboard">
          ⌨️&nbsp;
        </span>
        Edit&nbsp;
        <code><%= modifyFile %></code>
        &nbsp;and save to reload.
      </p>
      <a
        className={styles["App-link"]}
        href="https://github.com/front-end-captain/luban/blob/master/packages/%40luban/cli/README.md"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span role="img" aria-label="link">
          🔗&nbsp;
        </span>
        Visit more about Luban documentation.
      </a>
    </header>
  </div>
);

export default hot(App);