import styles from './app-layout.module.css';
import Header from '../header/header';
import Footer from '../footer/footer';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className={styles.main}>
      <header className={styles.main__header}>
        <div className={styles.main__container}>
          <Header />
        </div>
      </header>
      <div className={styles.main__content}>
        <div className={styles.main__container}>
          <Outlet />
        </div>
      </div>
      <footer className={styles.main__footer}>
        <div className={styles.main__container}>
          <Footer />
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
