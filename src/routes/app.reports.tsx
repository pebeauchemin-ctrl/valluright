          buyerSettings: bs.data ?? null,
        });
      } catch (error) {
        if (!cancelled) {
          setBundle(null);
          setLoadError(errorMessage(error, "Could not load reports."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadReports();
    return () => {
      cancelled = true;
    };
  }, [current, loadAttempt]);

  const saveCurrentSnapshot = async () => {
    if (!bundle) return;
    setSavingSnapshot(true);
    try {
      const inputs = toBusinessInputs(
        bundle.business,
        bundle.financials,
        bundle.multipleAssumptions,
      );
      const liveValuation = valueBusiness(inputs);
      const liveHealth = computeHealthScore(inputs);
      await persistValuationSnapshot(
        supabase,
        bundle.business.id,
        inputs,
        liveValuation,
        liveHealth,
      );
      toast.success("Saved a current valuation snapshot for reports.");
      setLoadAttempt((attempt) => attempt + 1);
    } catch (error) {
      toast.error(errorMessage(error, "Could not save current valuation snapshot."));
    } finally {
      setSavingSnapshot(false);
    }
  };
