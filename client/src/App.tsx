import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.layout}>
      <main className={styles.viewer}>
        <p>Viewer</p>
      </main>
      <aside className={styles.panel}>
        <p>Bucket Panel</p>
      </aside>
    </div>
  );
}
