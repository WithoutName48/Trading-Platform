import styles from './Homes.module.css';
import Chart from './components/chart/Chart';

const Home = () => {  
  const listTickerSymbols: string[] = [
    'BTC/USD',
    'AUX/USD',
    'EUR/USD'
  ]

  return (
    <div className={styles.container}>
      {
        listTickerSymbols.map((val: string, indx: number) => {
          return (
            <Chart key={indx} ticker={val} />
          )
        })
      }
    </div>
  );
}

export default Home;
