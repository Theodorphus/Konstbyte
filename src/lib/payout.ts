export function calculatePayout(orderAmount: number, commissionRate: number) {
  const commissionAmount   = orderAmount * commissionRate;
  const commissionVat      = commissionAmount * 0.25;
  const sellerPayoutAmount = orderAmount - commissionAmount;
  return { commissionAmount, commissionVat, sellerPayoutAmount };
}

export function defaultCommissionRate(): number {
  return (Number(process.env.PLATFORM_FEE_PERCENT) || 3) / 100;
}
