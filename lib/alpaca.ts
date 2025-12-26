import Alpaca from '@alpacahq/alpaca-trade-api'
import { AlpacaAccount, AlpacaPosition, AlpacaOrder } from '@/types'

class AlpacaClient {
  private client: any

  constructor() {
    const apiKey = process.env.ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY
    const baseUrl = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'

    if (!apiKey || !secretKey) {
      console.error('Alpaca API credentials not found in environment variables')
      console.error('ALPACA_API_KEY:', apiKey ? 'SET' : 'MISSING')
      console.error('ALPACA_SECRET_KEY:', secretKey ? 'SET' : 'MISSING')
    }

    this.client = new Alpaca({
      keyId: apiKey || 'placeholder',
      secretKey: secretKey || 'placeholder',
      paper: true, // Paper trading mode
      usePolygon: false,
      baseUrl: baseUrl,
    })
  }

  async getAccount(): Promise<AlpacaAccount> {
    const account = await this.client.getAccount()
    return {
      equity: account.equity,
      cash: account.cash,
      buying_power: account.buying_power,
      portfolio_value: account.portfolio_value,
    }
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    const positions = await this.client.getPositions()
    return positions.map((pos: any) => ({
      symbol: pos.symbol,
      qty: pos.qty,
      avg_entry_price: pos.avg_entry_price,
      current_price: pos.current_price,
      market_value: pos.market_value,
      unrealized_pl: pos.unrealized_pl,
      unrealized_plpc: pos.unrealized_plpc,
    }))
  }

  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    try {
      const pos = await this.client.getPosition(symbol)
      return {
        symbol: pos.symbol,
        qty: pos.qty,
        avg_entry_price: pos.avg_entry_price,
        current_price: pos.current_price,
        market_value: pos.market_value,
        unrealized_pl: pos.unrealized_pl,
        unrealized_plpc: pos.unrealized_plpc,
      }
    } catch (error) {
      return null
    }
  }

  async getBars(symbol: string, timeframe: string = '1Day', limit: number = 100) {
    const bars = await this.client.getBarsV2(symbol, {
      timeframe,
      limit,
    })
    
    const barData = []
    for await (const bar of bars) {
      barData.push(bar)
    }
    return barData
  }

  async getLatestTrade(symbol: string) {
    const trade = await this.client.getLatestTrade(symbol)
    return trade
  }

  async createOrder(
    symbol: string,
    qty: number,
    side: 'buy' | 'sell',
    type: 'market' | 'limit' = 'market',
    timeInForce: 'day' | 'gtc' = 'day'
  ): Promise<AlpacaOrder> {
    const order = await this.client.createOrder({
      symbol,
      qty,
      side,
      type,
      time_in_force: timeInForce,
    })

    return {
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      filled_avg_price: order.filled_avg_price,
      filled_at: order.filled_at,
      status: order.status,
    }
  }

  async getOrders(status: 'open' | 'closed' | 'all' = 'all') {
    return await this.client.getOrders({ status })
  }

  async cancelAllOrders() {
    return await this.client.cancelAllOrders()
  }

  async isMarketOpen(): Promise<boolean> {
    const clock = await this.client.getClock()
    return clock.is_open
  }

  async getMarketCalendar() {
    return await this.client.getCalendar()
  }
}

export const alpacaClient = new AlpacaClient()

